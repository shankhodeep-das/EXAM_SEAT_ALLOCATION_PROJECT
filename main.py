import STUDENTS_SECTION.Student_add as STA
import STUDENTS_SECTION.Student_remove as STR
import STUDENTS_SECTION.Student_display as STD
import STUDENTS_SECTION.Student_search as STS
import EXAM_SECTION.Check_capacity as EXC
import questionary
import SEAT_SECTION.Seating_arrangements as SAA 

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
        print("\n🚀 You chose the Proper GUI! Setting up project...\n")
    elif choice == "Terminal Output":
        print("\n🚀 You chose the Terminal Output! Setting up project...\n")
        while True:
                try:
                    print(f"\n---------------------Welcome to EXAM SEAT ALLOCATION SYSTEM-------------------------\n")
                    n = int(input(
                        f"""
                1. Add Students (DONE)
                2. Remove Students (DONE)
                3. Display Students (DONE)
                4. Validate Students
                5. Calculate Room Capacity (DONE)
                6. Check Capacity (DONE)
                7. Display Seating Plan / Run Allocation
                8. Search Students (DONE)
                9. Find Students Seat
                10. Generate Room Summary
                11. Exit
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
                elif n == 5 or n == 6:
                    room_no = input("Enter the Room No (in this Format R-001): ")
                    EXC.check_capacity(room_no)
                elif n == 7:
                    print("\nRunning Seat Allocation...")
                    rooms_result, leftover_spec, leftover_reg = SAA.load_data_and_run()
                    
                    if rooms_result:
                        SAA.save_allocation_results(rooms_result, leftover_spec, leftover_reg)
                        print("\nAllocation saved successfully to 'Allocated_Seats.txt'!")
                elif n == 8:
                    STS.Student_Search()
                elif n == 11:
                    print("Exiting system. Goodbye!")
                    break
                else:
                    print(f"Invalid option or feature under development. Try again!")
    else:
        print("Goodbye!")
if __name__ == "__main__":
    main()