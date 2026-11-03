import os

script_dir = os.path.dirname(os.path.abspath(__file__))

Allocated_file_path = os.path.join(
    script_dir, "..", "SEAT_SECTION", "Allocated_Seats_Data_Sem.txt"
)





def find_student_seat(target_student_id):
    target = target_student_id.upper()
    current_room = "Unknown Room"
    found = False

    try:
        with open(Allocated_file_path, 'r', encoding='utf-8') as f:
            for line_no, line in enumerate(f, 1):
                # Track which room we are currently looking at as we parse down the file
                if "Room ID:" in line:
                    current_room = line.strip()
                
                # Check if the student ID exists in the current line
                if target in line:
                    line_stripped = line.strip()
                    
                    # Extract Row Name (e.g., "Row 1:") and split the rest into individual seats/columns
                    parts = line_stripped.split(":", 1)
                    row_name = parts[0].strip() if len(parts) >  1 else "Unknown Row"
                    
                    # Find individual student blocks (split by spaces or brackets)
                    # Each item in this list represents a column position in that row
                    seats_in_row = [seat.strip() for seat in line_stripped.split() if "[" in seat]
                    
                    # Find which column index the target student belongs to
                    col_index = -1
                    for idx, seat_block in enumerate(seats_in_row):
                        if target in seat_block:
                            col_index = idx + 1  # 1-based index for columns (Column 1, 2, 3...)
                            break

                    print("\n" + "=" * 60)
                    print(f"[✔] Student Found: {target}")
                    print(f"Location Details -> {current_room}")
                    print(f"Row Position     -> {row_name}")
                    print(f"Column / Seat No -> Column {col_index} (Index {col_index - 1})")
                    print(f"Full Row Data    -> {line_stripped}")
                    print("=" * 60 + "\n")
                    
                    found = True
                    break

        if not found:
            print(f"\n[!] Student ID '{target_student_id}' was not found in the seating file.\n")

    except FileNotFoundError:
        print(f"\n[!] Error: The file '{Allocated_file_path}' could not be found.\n")

# --- Example Usage ---
if __name__ == "__main__":
    find_student_seat()