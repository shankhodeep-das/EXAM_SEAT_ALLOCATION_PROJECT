
import os
import csv
from itertools import permutations
from collections import defaultdict


# ==================================================
# 1. FILE PATHS
# ==================================================

script_dir = os.path.dirname(os.path.abspath(__file__))

Student_file_path = os.path.join(
    script_dir, "..", "STUDENTS_SECTION", "Students_Data.txt"
)

room_file_path = os.path.join(
    script_dir, "..", "EXAM_SECTION", "Exam_Room_Details.txt"
)

allocation_file_path = os.path.join(
    script_dir, "Allocated_Seats_Data.txt"
)


# ==================================================
# 2. USER INPUT
# ==================================================

max_courses_per_room = int(
    input("Enter maximum courses per room: ")
)

if max_courses_per_room < 1:
    raise ValueError("Number of courses must be at least 1.")


# ==================================================
# 3. STUDENT DATA
# ==================================================

course_with_students = defaultdict(list)


def parse_bool(value):
    return value.strip().lower() in ("true", "1", "yes")


with open(Student_file_path, "r", encoding="utf-8") as f:

    reader = csv.reader(f)

    for parts in reader:

        if not parts:
            continue

        student_id = parts[0].strip()

        ID_Parts = student_id.split("/")

        if len(ID_Parts) < 4:
            raise ValueError(
                f"Invalid student ID: {student_id}"
            )

        # Extract complete course name.
        # Handles course names containing "/".

        course_name = "/".join(ID_Parts[1:-2])

        # First Boolean field = Special seat eligibility
        # Second Boolean field = Ignored

        if len(parts) < 3:
            raise ValueError(
                f"Invalid student record: {student_id}"
            )

        special_eligible = parse_bool(parts[-2])

        course_with_students[course_name].append(
            (student_id, special_eligible)
        )


# ==================================================
# 4. ROOM DATA
# ==================================================

room_details = {}

with open(room_file_path, "r", encoding="utf-8") as f:

    reader = csv.reader(f)

    for parts in reader:

        if not parts:
            continue

        room_no = parts[0].strip()

        capacity = int(parts[1])
        rows = int(parts[2])
        cols = int(parts[3])

        invigilator_name = parts[4].strip()
        special_seats = int(parts[5])

        if rows <= 0 or cols <= 0 or capacity <= 0:
            raise ValueError(
                f"Invalid room dimensions: {room_no}"
            )

        if capacity > rows * cols:
            raise ValueError(
                f"Capacity exceeds room dimensions: {room_no}"
            )

        if special_seats < 0 or special_seats > capacity:
            raise ValueError(
                f"Invalid special seat count: {room_no}"
            )

        room_details[room_no] = {
            "capacity": capacity,
            "rows": rows,
            "cols": cols,
            "invigilator": invigilator_name,
            "special_seats": special_seats
        }


# ==================================================
# 5. CREATE SEATING POSITIONS
# ==================================================

def create_positions(rows, cols, capacity,
                     special_count, number_of_courses):

    # Physical positions in row-major order

    physical_positions = [
        (i, j)
        for i in range(rows)
        for j in range(cols)
    ][:capacity]

    # One course: use alternating positions.
    # Other positions remain empty.

    if number_of_courses == 1:

        colors = {
            0: [
                (i, j)
                for i, j in physical_positions
                if (i + j) % 2 == 0
            ]
        }

    else:

        # Dynamic checkerboard pattern

        colors = {
            k: [
                (i, j)
                for i, j in physical_positions
                if (i + j) % number_of_courses == k
            ]
            for k in range(number_of_courses)
        }

    # All positions are available physical seats
    # for K >= 2. For K = 1, only checkerboard
    # positions are valid.

    if number_of_courses == 1:
        valid_positions = colors[0]
    else:
        valid_positions = physical_positions

    # Reserve special seats from first row onwards

    special_positions = set(
        valid_positions[:special_count]
    )

    if len(special_positions) != special_count:
        raise ValueError(
            "Not enough valid positions for special seats."
        )

    return valid_positions, special_positions, colors


# ==================================================
# 6. CALCULATE COURSE ALLOCATION CAPACITY
# ==================================================

def calculate_allocation(
    students,
    positions,
    special_positions
):

    eligible_count = sum(
        1 for student_id, eligible in students
        if eligible
    )

    available_special = sum(
        1 for position in positions
        if position in special_positions
    )

    available_normal = (
        len(positions) - available_special
    )

    # Eligible students occupy special seats first

    special_fill = min(
        eligible_count,
        available_special
    )

    # Remaining students occupy normal seats

    normal_fill = min(
        len(students) - special_fill,
        available_normal
    )

    return special_fill + normal_fill, special_fill


# ==================================================
# 7. SELECT COURSES FOR EACH ROOM
# ==================================================

def select_courses(
    remaining_courses,
    rows,
    cols,
    capacity,
    special_count,
    max_courses
):

    available_courses = [
        course
        for course, students in remaining_courses.items()
        if students
    ]

    if not available_courses:
        return None

    # Select courses with the largest remaining
    # student populations

    selected_courses = sorted(
        available_courses,
        key=lambda course: len(
            remaining_courses[course]
        ),
        reverse=True
    )[:max_courses]

    K = len(selected_courses)

    positions, special_positions, colors = create_positions(
        rows,
        cols,
        capacity,
        special_count,
        K
    )

    best_plan = None
    best_score = (-1, -1)

    # Try different course-to-colour assignments

    for course_order in permutations(selected_courses):

        course_positions = {}

        total_allocated = 0
        total_special = 0

        for color_index, course in enumerate(course_order):

            assigned_positions = colors[color_index]

            course_positions[course] = assigned_positions

            allocated, special_allocated = calculate_allocation(
                remaining_courses[course],
                assigned_positions,
                special_positions
            )

            total_allocated += allocated
            total_special += special_allocated

        score = (
            total_allocated,
            total_special
        )

        if score > best_score:

            best_score = score

            best_plan = {
                "course_positions": course_positions,
                "special_positions": special_positions
            }

    return best_plan


# ==================================================
# 8. PLACE STUDENTS IN THEIR ALLOTTED POSITIONS
# ==================================================

def place_students(
    students,
    positions,
    special_positions,
    seats,
    course_name
):

    remaining = list(students)

    allocated_count = 0

    # ----------------------------------------------
    # FIRST: Allocate eligible students to
    # special seats
    # ----------------------------------------------

    for i, j in positions:

        if (i, j) not in special_positions:
            continue

        student_index = next(
            (
                index
                for index, student in enumerate(remaining)
                if student[1] is True
            ),
            None
        )

        if student_index is not None:

            student_id, eligible = remaining.pop(
                student_index
            )

            seats[i][j] = (
                student_id,
                course_name,
                True
            )

            allocated_count += 1

    # ----------------------------------------------
    # SECOND: Allocate remaining students
    # to normal seats
    # ----------------------------------------------

    for i, j in positions:

        if (i, j) in special_positions:
            continue

        if not remaining:
            break

        student_id, eligible = remaining.pop(0)

        seats[i][j] = (
            student_id,
            course_name,
            False
        )

        allocated_count += 1

    return remaining, allocated_count


# ==================================================
# 9. COMPLETE ROOM ALLOCATION
# ==================================================

def allocate_room(plan, details):

    rows = details["rows"]
    cols = details["cols"]

    seats = [
        ["EMPTY" for _ in range(cols)]
        for _ in range(rows)
    ]

    allocated_counts = {}

    # Allocate each selected course

    for course, positions in plan["course_positions"].items():

        remaining, count = place_students(
            course_with_students[course],
            positions,
            plan["special_positions"],
            seats,
            course
        )

        # Update original course list

        course_with_students[course] = remaining

        allocated_counts[course] = count

    return seats, allocated_counts


# ==================================================
# 10. VALIDATE SEATING ARRANGEMENT
# ==================================================

def validate_seating(seats):

    rows = len(seats)
    cols = len(seats[0]) if rows else 0

    for i in range(rows):

        for j in range(cols):

            current = seats[i][j]

            if current == "EMPTY":
                continue

            current_course = current[1]

            # Check right-side neighbour

            if j + 1 < cols:

                neighbour = seats[i][j + 1]

                if (
                    neighbour != "EMPTY"
                    and neighbour[1] == current_course
                ):
                    return False

            # Check bottom neighbour

            if i + 1 < rows:

                neighbour = seats[i + 1][j]

                if (
                    neighbour != "EMPTY"
                    and neighbour[1] == current_course
                ):
                    return False

    return True


# ==================================================
# 11. GENERATE OUTPUT FILE
# ==================================================

total_allocated = 0
rooms_used = 0

with open(allocation_file_path, "w", encoding="utf-8") as f:

    for room_no, details in room_details.items():

        # Select courses for the current room

        plan = select_courses(
            course_with_students,
            details["rows"],
            details["cols"],
            details["capacity"],
            details["special_seats"],
            max_courses_per_room
        )

        if plan is None:
            break

        # Allocate students

        seats, allocated_counts = allocate_room(
            plan,
            details
        )

        # Validate before generating output

        if not validate_seating(seats):

            raise RuntimeError(
                f"Seating validation failed in room {room_no}"
            )

        courses_in_room = " & ".join(
            plan["course_positions"].keys()
        )

        room_allocated = sum(
            allocated_counts.values()
        )

        total_allocated += room_allocated
        rooms_used += 1

        # ------------------------------------------
        # ROOM HEADING
        # ------------------------------------------

        f.write("=" * 75 + "\n")

        f.write(
            "EXAM SEATING PLAN\n"
        )

        f.write("=" * 75 + "\n\n")

        f.write(
            f"Room ID: {room_no} | "
            f"Invigilator: {details['invigilator']} | "
            f"Courses: [{courses_in_room}] | "
            f"Capacity: {details['capacity']} "
            f"(Special Seats: {details['special_seats']})\n\n"
        )

        # ------------------------------------------
        # SEATING ARRANGEMENT
        # ------------------------------------------

        for i, row in enumerate(seats):

            f.write(f"Row {i + 1}: ")

            for j, student in enumerate(row):

                if student == "EMPTY":

                    if (i, j) in plan["special_positions"]:

                        f.write("[SPECIAL EMPTY] ")

                    else:

                        f.write("[EMPTY] ")

                else:

                    student_id, course, is_special = student

                    if is_special:

                        f.write(
                            f"[{student_id}|Course:{course}|SPECIAL] "
                        )

                    else:

                        f.write(
                            f"[{student_id}|Course:{course}] "
                        )

            f.write("\n\n")

        # ------------------------------------------
        # COURSE-WISE REPORT
        # ------------------------------------------

        f.write("COURSE ALLOCATION DETAILS\n")

        for course, count in allocated_counts.items():

            f.write(
                f"{course}: {count} students allocated\n"
            )

        f.write(
            f"\nTotal Students Allocated: {room_allocated}\n"
        )

        f.write("\n" + "=" * 75 + "\n\n")


# ==================================================
# 12. UNALLOCATED STUDENT REPORT
# ==================================================

unallocated_count = 0

print("\n========== ALLOCATION SUMMARY ==========\n")

for course, students in course_with_students.items():

    if students:

        print(f"\nCourse: {course}")

        for student_id, eligible in students:

            print("Unallocated:", student_id)

        unallocated_count += len(students)


# ==================================================
# 13. FINAL SUMMARY
# ==================================================

print("\n========== FINAL REPORT ==========\n")

print("Maximum Courses Per Room:", max_courses_per_room)

print("Total Rooms Used:", rooms_used)

print("Total Students Allocated:", total_allocated)

print("Total Unallocated Students:", unallocated_count)

print("\nSeating allocation completed.")

print("Output File:", allocation_file_path)
