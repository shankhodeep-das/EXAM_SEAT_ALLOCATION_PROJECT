import os

def delete_student():
    target_roll = input("Enter the Roll Number of the student to delete (e.g., BWU/BCA/25/071): ").strip()
    script_dir = os.path.dirname(__file__)
    file_path = os.path.join(script_dir, "Students_Data.txt")
    lines = []
    student_found = False
    with open(file_path, "r") as file:
        for line in file:
            if line.startswith(target_roll + ","):
                student_found = True
            else:
                lines.append(line)
    if student_found:
        with open(file_path, "w") as file:
            file.writelines(lines)
        print("Student record deleted successfully!")
    else:
        print("Student Roll Number not found in the file.")
        
if __name__ == "__main__":
    delete_student()