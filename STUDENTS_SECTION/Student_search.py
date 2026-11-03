import os


def Student_Search():
    target_roll = (
        input("Enter Full Roll Number to search (e.g., BWU/BCA/25/071): ")
        .strip()
        .upper()
    )

    if not target_roll:
        print("Input cannot be empty.")
        return

    script_dir = os.path.dirname(__file__)
    file_path = os.path.join(script_dir, "Students_Data.txt")

    if not os.path.exists(file_path):
        print("Students_Data.txt not found. Please generate the data first.")
        return

    print(f"\nSearching for roll number: {target_roll} (Linear Search)...")

    found_line = None
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line_str = line.strip()
            if not line_str:
                continue

            parts = line_str.split(",")
            current_roll = parts[0].strip().upper()
            if current_roll == target_roll:
                found_line = line_str
                break

    if found_line:
        parts = found_line.split(",")
        print("\n--- Student Found Successfully! ---")
        print(f"Roll Number : {parts[0]}")
        print(f"Name        : {parts[1]}")
        print(f"Section     : {parts[2]}")
        print(f"Subjects    : {parts[3]}, {parts[4]}, {parts[5]}, {parts[6]}")
        print(f"Pref. Room  : {'YES' if parts[7].strip() == 'True' else 'NO'}")
        print(f"Req. Status : {'YES' if parts[7].strip() == 'True' else 'NO'}")
    else:
        print(f"\nStudent Roll Number '{target_roll}' not found in records.")


if __name__ == "__main__":
    Student_Search()