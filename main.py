from SEAT_SECTION.Student_Seat_position import find_student_seat
from SEAT_SECTION.View_Room_Details import view_single_room
import STUDENTS_SECTION.Student_add as STA
import STUDENTS_SECTION.Student_remove as STR
import STUDENTS_SECTION.Student_display as STD
import STUDENTS_SECTION.Student_search as STS
import EXAM_SECTION.Check_capacity as EXC
import questionary

def main():
    choice = questionary.select(
        "Select how you want to see the OUTPUT:",
        choices=[
            "Proper GUI",
            "Terminal Output",
            "Exit"
        ]
    ).ask()
    if choice == "Proper GUI":
        print("\n🚀 Under Development, Please give us some more time!\n")
    elif choice == "Terminal Output":
        print("\n🚀 You chose the Terminal Output! Setting up project...\n")
        while True:
                try:
                    print(f"\n---------------------Welcome to EXAM SEAT ALLOCATION SYSTEM-------------------------\n")
                    n = int(input(f"""
1. Add Students 
2. Remove Students 
3. Display Students 
4. Calculate Room Capacity 
5. Search Students 
6. Find Students Seat
7. Generate Room Summary
8. Exit
Enter Your Option number: """
                    ))
                except ValueError:
                    print("Please enter a valid number!")
                    continue
        
                if n == 1:
                    STA.add_students()
                elif n == 2:
                    STR.delete_student()
                elif n == 3:
                    STD.view_students()
                elif n == 4:
                    room_no = input("Enter the Room No (in this Format R-001): ")
                    EXC.check_capacity(room_no)
                elif n == 5:
                    STS.Student_Search()
                elif n == 6:
                    student_query = input("Enter Student ID to search (e.g., BWU/BCA/25/071): ").strip()
                    find_student_seat(student_query)
                elif n == 7:
                    room_no = input("Enter the Room No (in this Format R-001): ")
                    view_single_room(room_no)
                elif n == 8:
                    print("Exiting system. Goodbye!")
                    break
                else:
                    print(f"Invalid option. Try again!")
    else:
        print("Goodbye!")
if __name__ == "__main__":
    main()