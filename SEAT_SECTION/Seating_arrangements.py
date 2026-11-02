from collections import defaultdict, deque
import os

script_dir = os.path.dirname(__file__)
Student_file_path = os.path.join(
    script_dir, "..", "STUDENTS_SECTION", "Students_Data.txt"
)
room_file_path = os.path.join(
    script_dir, "..", "EXAM_SECTION", "Exam_Room_Details.txt"
)


def allocate_seats(rooms_raw, students_raw):
  # 1. Parse Rooms Data Safely
  rooms = []
  for r in rooms_raw:
    line = r[0] if isinstance(r, list) else r
    parts = [p.strip() for p in line.split(",")]

    if len(parts) < 4:
      continue

    try:
      room_id = parts[0]
      total_capacity = int(parts[1])
      invigilator = parts[2]
      special_seats_count = int(parts[3])
    except ValueError:
      continue

    rooms.append({
        "room_id": room_id,
        "invigilator": invigilator,
        "total_capacity": total_capacity,
        "special_capacity": special_seats_count,
        "regular_capacity": total_capacity - special_seats_count,
        "allocated_special": [],
        "allocated_regular": [],
    })

  # 2. Parse Students Data & Separate into Sections/Queues
  # We use dictionaries of deques grouped by section to enable round-robin interleaving
  special_by_section = defaultdict(deque)
  regular_by_section = defaultdict(deque)

  for s in students_raw:
    line = s[0] if isinstance(s, list) else s
    parts = [p.strip() for p in line.split(",")]

    if len(parts) < 8:
      continue

    student_obj = {
        "id": parts[0],
        "name": parts[1],
        "section": parts[2],
        "subjects": parts[3:7],
        "special_req": parts[7].lower() == "true",
    }

    if student_obj["special_req"]:
      special_by_section[student_obj["section"]].append(student_obj)
    else:
      regular_by_section[student_obj["section"]].append(student_obj)

  # Helper function to perform round-robin allocation from section buckets
  def distribute_alternating(source_dict, target_list, limit):
    allocated_count = 0
    sections = list(source_dict.keys())

    while allocated_count < limit and sections:
      empty_sections = []
      for sec in sections:
        if allocated_count >= limit:
          break
        if source_dict[sec]:
          target_list.append(source_dict[sec].popleft())
          allocated_count += 1
        else:
          empty_sections.append(sec)

      # Clean up depleted section queues
      for sec in empty_sections:
        sections.remove(sec)

    return allocated_count

  # 3. Allocate Special Requirement Students with Alternating Sections
  for room in rooms:
    target_special_count = room["special_capacity"]
    allocated_spec = []
    # Pull in alternating fashion across sections
    distribute_alternating(special_by_section, allocated_spec, target_special_count)
    room["allocated_special"] = allocated_spec
    room["special_capacity"] -= len(allocated_spec)

  # 4. Allocate Regular Students to Regular & Special Seats Alternately
  for room in rooms:
    # Fill regular capacity slots with mixed sections
    target_reg_count = room["regular_capacity"]
    allocated_reg = []
    distribute_alternating(regular_by_section, allocated_reg, target_reg_count)
    room["allocated_regular"] = allocated_reg
    room["regular_capacity"] -= len(allocated_reg)

    # If overflow spills into special seats, keep mixing sections
    if room["special_capacity"] > 0:
      overflow_target = room["special_capacity"]
      allocated_overflow = []
      distribute_alternating(
          regular_by_section, allocated_overflow, overflow_target
      )
      room["allocated_special"].extend(allocated_overflow)
      room["special_capacity"] -= len(allocated_overflow)

  # Reconstruct leftover global deques for reporting if needed
  leftover_special = deque(
      [s for q in special_by_section.values() for s in q]
  )
  leftover_regular = deque([s for q in regular_by_section.values() for s in q])

  return rooms, leftover_special, leftover_regular


# --- Function to Read Files Securely ---
def load_data_and_run():
  rooms_raw = []
  students_raw = []

  # Read Rooms File
  if os.path.exists(room_file_path):
    with open(room_file_path, "r", encoding="utf-8") as f:
      for line in f:
        if line.strip():
          rooms_raw.append(line.strip())
  else:
    print(f"Error: Room file not found at {room_file_path}")
    return None, None, None

  # Read Students File (Line by line to handle 1M+ rows safely)
  if os.path.exists(Student_file_path):
    with open(Student_file_path, "r", encoding="utf-8") as f:
      for line in f:
        if line.strip():
          students_raw.append(line.strip())
  else:
    print(f"Error: Student file not found at {Student_file_path}")
    return None, None, None

  print(
      f"Loaded {len(rooms_raw)} rooms and {len(students_raw)} students. Running"
      " alternating allocation..."
  )

  # Run the allocation
  allocated_rooms, unassigned_special, unassigned_regular = allocate_seats(
      rooms_raw, students_raw
  )

  print("Allocation completed successfully!")
  return allocated_rooms, unassigned_special, unassigned_regular


def save_allocation_results(
    allocated_rooms, unassigned_special, unassigned_regular
):
  output_path = os.path.join(
      script_dir, "..", "SEAT_SECTION", "Allocated_Seats.txt"
  )

  with open(output_path, "w", encoding="utf-8") as f:
    f.write("=== EXAM SEAT ALLOCATION REPORT (NON-ADJACENT SECTIONS) ===\n\n")

    for room in allocated_rooms:
      f.write(
          f"Room ID: {room['room_id']} | Invigilator:"
          f" {room['invigilator']}\n"
      )
      f.write("-" * 50 + "\n")

      f.write(
          f"  [Special Seats Allocated:"
          f" {len(room['allocated_special'])}]\n"
      )
      for student in room["allocated_special"]:
        f.write(
            f"    - {student['id']} | {student['name']} | Sec:"
            f" {student['section']}\n"
        )

      f.write(
          f"  [Regular Seats Allocated:"
          f" {len(room['allocated_regular'])}]\n"
      )
      for student in room["allocated_regular"]:
        f.write(
            f"    - {student['id']} | {student['name']} | Sec:"
            f" {student['section']}\n"
        )

      f.write("\n" + "=" * 50 + "\n\n")

    # Summary of unassigned students (if any)
    total_unassigned = len(unassigned_special) + len(unassigned_regular)
    f.write(f"SUMMARY: Total Unassigned Students: {total_unassigned}\n")

  print(f"Allocation report successfully saved to: {output_path}")


# Execute
if __name__ == "__main__":
  rooms_result, leftover_special, leftover_regular = load_data_and_run()

  if rooms_result:
    save_allocation_results(
        rooms_result, leftover_special, leftover_regular
    )