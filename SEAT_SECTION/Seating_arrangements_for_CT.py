
import os
import csv
from itertools import permutations
from collections import defaultdict

script_dir = os.path.dirname(os.path.abspath(__file__))

Student_file_path = os.path.join(
    script_dir, "..", "STUDENTS_SECTION", "Students_Data.txt"
)

room_file_path = os.path.join(
    script_dir, "..", "EXAM_SECTION", "Exam_Room_Details.txt"
)

allocation_file_path = os.path.join(
    script_dir, "Allocated_Seats_Data_CT.txt"
)

max_sections_per_room = int(
    input("Enter maximum sections per room: ")
)

if max_sections_per_room < 1:
    raise ValueError("Number of sections must be at least 1.")



course_with_sections = defaultdict(
    lambda: defaultdict(list)
)


def parse_bool(value):

    return value.strip().lower() in (
        "true", "1", "yes"
    )


with open(Student_file_path, "r", encoding="utf-8") as f:

    reader = csv.reader(f)

    for parts in reader:

        if not parts:
            continue

        student_id = parts[0].strip()

        if len(parts) < 4:
            raise ValueError(
                f"Invalid student record: {student_id}"
            )


        ID_Parts = student_id.split("/")

        if len(ID_Parts) < 4:
            raise ValueError(
                f"Invalid student ID: {student_id}"
            )

        course_name = "/".join(ID_Parts[1:-2])


        section = parts[2].strip()


        special_eligible = parse_bool(parts[-2])

        if not course_name or not section:
            raise ValueError(
                f"Missing course or section: {student_id}"
            )

        course_with_sections[course_name][section].append(
            (student_id, special_eligible)
        )

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
                f"Room capacity exceeds dimensions: {room_no}"
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


def create_section_positions(
    rows,
    cols,
    capacity,
    special_count,
    number_of_sections
):


    physical_positions = [
        (i, j)
        for i in range(rows)
        for j in range(cols)
    ][:capacity]

    if number_of_sections == 1:

        colors = {
            0: [
                (i, j)
                for i, j in physical_positions
                if (i + j) % 2 == 0
            ]
        }

        valid_positions = colors[0]

    else:

        colors = {
            k: [
                (i, j)
                for i, j in physical_positions
                if (i + j) % number_of_sections == k
            ]
            for k in range(number_of_sections)
        }

        valid_positions = physical_positions


    special_positions = set(
        valid_positions[:special_count]
    )

    if len(special_positions) != special_count:

        raise ValueError(
            "Not enough valid positions for special seats."
        )

    return colors, special_positions

def calculate_section_capacity(
    students,
    positions,
    special_positions
):

    eligible_count = sum(
        1
        for student_id, eligible in students
        if eligible
    )

    available_special = sum(
        1
        for position in positions
        if position in special_positions
    )

    available_normal = (
        len(positions) - available_special
    )


    special_allocated = min(
        eligible_count,
        available_special
    )


    normal_allocated = min(
        len(students) - special_allocated,
        available_normal
    )

    total_allocated = (
        special_allocated + normal_allocated
    )

    return total_allocated, special_allocated

def select_course_and_sections(
    remaining_data,
    rows,
    cols,
    capacity,
    special_count,
    max_sections
):

    best_plan = None
    best_score = (-1, -1)

    for course, sections in remaining_data.items():

        available_sections = [
            section
            for section, students in sections.items()
            if students
        ]

        if not available_sections:
            continue


        max_possible_sections = min(
            max_sections,
            len(available_sections),
            capacity,
            rows + cols - 1
        )

        if max_possible_sections < 1:
            continue

        selected_sections = sorted(
            available_sections,
            key=lambda section: len(sections[section]),
            reverse=True
        )[:max_possible_sections]

        K = len(selected_sections)

        colors, special_positions = create_section_positions(
            rows,
            cols,
            capacity,
            special_count,
            K
        )

        for section_order in permutations(selected_sections):

            section_positions = {}

            total_allocated = 0
            total_special = 0

            for color_index, section in enumerate(section_order):

                positions = colors[color_index]

                section_positions[section] = positions

                allocated, special_allocated = (
                    calculate_section_capacity(
                        sections[section],
                        positions,
                        special_positions
                    )
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
                    "course": course,
                    "section_positions": section_positions,
                    "special_positions": special_positions
                }

    return best_plan


def allocate_section_students(
    students,
    positions,
    special_positions,
    seats,
    course,
    section
):

    remaining = list(students)

    allocated_count = 0


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
                course,
                section,
                True
            )

            allocated_count += 1

    for i, j in positions:

        if (i, j) in special_positions:
            continue

        if not remaining:
            break

        student_id, eligible = remaining.pop(0)

        seats[i][j] = (
            student_id,
            course,
            section,
            False
        )

        allocated_count += 1

    return remaining, allocated_count


def allocate_section_room(plan, details):

    rows = details["rows"]
    cols = details["cols"]

    seats = [
        ["EMPTY" for _ in range(cols)]
        for _ in range(rows)
    ]

    allocation_report = {}

    course = plan["course"]


    for section, positions in plan["section_positions"].items():

        remaining, count = allocate_section_students(
            course_with_sections[course][section],
            positions,
            plan["special_positions"],
            seats,
            course,
            section
        )


        course_with_sections[course][section] = remaining

        allocation_report[section] = count

    return seats, allocation_report


def validate_section_seating(seats):

    rows = len(seats)
    cols = len(seats[0]) if rows else 0

    for i in range(rows):

        for j in range(cols):

            current = seats[i][j]

            if current == "EMPTY":
                continue

            current_section = current[2]


            if j + 1 < cols:

                neighbour = seats[i][j + 1]

                if (
                    neighbour != "EMPTY"
                    and neighbour[2] == current_section
                ):
                    return False

            if i + 1 < rows:

                neighbour = seats[i + 1][j]

                if (
                    neighbour != "EMPTY"
                    and neighbour[2] == current_section
                ):
                    return False

    return True

total_allocated = 0
rooms_used = 0

with open(allocation_file_path, "w", encoding="utf-8") as f:

    for room_no, details in room_details.items():

        plan = select_course_and_sections(
            course_with_sections,
            details["rows"],
            details["cols"],
            details["capacity"],
            details["special_seats"],
            max_sections_per_room
        )

        if plan is None:
            break

        seats, allocation_report = allocate_section_room(
            plan,
            details
        )

        if not validate_section_seating(seats):

            raise RuntimeError(
                f"Seating validation failed in room {room_no}"
            )

        course = plan["course"]

        sections = list(
            plan["section_positions"].keys()
        )

        room_allocated = sum(
            allocation_report.values()
        )

        total_allocated += room_allocated
        rooms_used += 1
        f.write("=" * 75 + "\n")

        f.write("EXAM SEATING PLAN\n")

        f.write("=" * 75 + "\n\n")

        f.write(
            f"Room ID: {room_no} | "
            f"Invigilator: {details['invigilator']} | "
            f"Course: {course} | "
            f"Sections: {sections} | "
            f"Capacity: {details['capacity']} | "
            f"Special Seats: {details['special_seats']}\n\n"
        )
        for i, row in enumerate(seats):

            f.write(f"ROW {i + 1}: ")

            for j, student in enumerate(row):

                if student == "EMPTY":

                    if (i, j) in plan["special_positions"]:

                        f.write("[SPECIAL EMPTY] ")

                    else:

                        f.write("[EMPTY] ")

                else:

                    student_id, course, section, special = student

                    if special:

                        f.write(
                            f"[{student_id}|Section:{section}|SPECIAL] "
                        )

                    else:

                        f.write(
                            f"[{student_id}|Section:{section}] "
                        )

            f.write("\n\n")
        f.write("SECTION-WISE ALLOCATION DETAILS\n")

        for section, count in allocation_report.items():

            f.write(
                f"Section {section}: "
                f"{count} students allocated\n"
            )

        f.write(
            f"\nTotal Students Allocated: {room_allocated}\n"
        )

        f.write("\n" + "=" * 75 + "\n\n")

total_students = sum(
    len(students)
    for sections in course_with_sections.values()
    for students in sections.values()
) + total_allocated

unallocated_count = 0
total_room_capacity = sum(
    details["capacity"]
    for details in room_details.values()
)

remaining_students = []

for course, sections in course_with_sections.items():

    for section, students in sections.items():

        for student_id, eligible in students:

            remaining_students.append({
                "student_id": student_id,
                "course": course,
                "section": section,
                "special_eligible": eligible
            })

unallocated_count = len(remaining_students)

reason_counts = defaultdict(int)

def identify_reason(student):

    course = student["course"]
    section = student["section"]
    if total_allocated >= total_room_capacity:

        return "Physical room capacity exhausted"
    if rooms_used >= len(room_details):

        return (
            "No rooms remain under the one-course-per-room "
            "allocation rule"
        )
    available_sections = [
        sec
        for sec, students in course_with_sections[course].items()
        if students
    ]

    if len(available_sections) > max_sections_per_room:

        return (
            "Section grouping limit: maximum sections "
            "per room is restricted"
        )
    return (
        "Seating pattern or allocation selection restriction"
    )


for student in remaining_students:

    reason = identify_reason(student)

    student["reason"] = reason

    reason_counts[reason] += 1

with open(
    allocation_file_path,
    "a",
    encoding="utf-8"
) as f:

    f.write("\n\n")
    f.write("=" * 75 + "\n")
    f.write("          DETAILED UNALLOCATED STUDENTS REPORT\n")
    f.write("=" * 75 + "\n\n")

    if not remaining_students:

        f.write("Congratulations! All students have been allocated.\n")

    else:

        for student in remaining_students:

            f.write(
                f"Student ID: {student['student_id']}\n"
            )

            f.write(
                f"Course: {student['course']}\n"
            )

            f.write(
                f"Section: {student['section']}\n"
            )

            f.write(
                f"Special Seat Eligible: "
                f"{student['special_eligible']}\n"
            )

            f.write(
                f"Reason: {student['reason']}\n"
            )

            f.write("-" * 75 + "\n")
    f.write("\n")
    f.write("=" * 75 + "\n")
    f.write("                 FINAL ALLOCATION SUMMARY\n")
    f.write("=" * 75 + "\n\n")

    f.write(f"Total Students: {total_students}\n")
    f.write(f"Total Physical Room Capacity: {total_room_capacity}\n")
    f.write(f"Total Rooms Available: {len(room_details)}\n")
    f.write(f"Total Rooms Used: {rooms_used}\n")
    f.write(f"Total Students Allocated: {total_allocated}\n")
    f.write(f"Total Unallocated Students: {unallocated_count}\n")

    f.write("\nREASON-WISE BREAKDOWN\n")
    f.write("-" * 75 + "\n")

    for reason, count in reason_counts.items():

        f.write(f"{reason}: {count}\n")

    f.write("\n")
    f.write("=" * 75 + "\n")
print("\n========== FINAL REPORT ==========\n")

print("Maximum Sections Per Room:", max_sections_per_room)

print("Total Physical Room Capacity:", total_room_capacity)

print("Total Rooms Available:", len(room_details))

print("Total Rooms Used:", rooms_used)

print("Total Students:", total_students)

print("Total Students Allocated:", total_allocated)

print("Total Unallocated Students:", unallocated_count)

print("\n========== REASON-WISE BREAKDOWN ==========\n")

for reason, count in reason_counts.items():

    print(f"{reason}: {count}")

print("\nSeating allocation completed.")

print("Output File:", allocation_file_path)