import os



script_dir = os.path.dirname(os.path.abspath(__file__))

Allocated_file_path = os.path.join(
    script_dir, "..", "SEAT_SECTION", "Allocated_Seats_Data_Sem.txt"
)



def view_single_room(room_no):
    try:
        with open(Allocated_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        blocks = content.split("EXAM SEATING PLAN")
        
        found = False
        for block in blocks:
            if f"Room ID: {room_no.upper()}" in block:
                print("\n" + "=" * 60)
                print("EXAM SEATING PLAN" + block.strip())
                print("=" * 60 + "\n")
                found = True
                break
                
        if not found:
            print(f"\n[!] Room ID '{room_no}' was not found in the seating file.\n")
            
    except FileNotFoundError:
        print(f"\n[!] Error: The file '{Allocated_file_path}' could not be found.\n")
if __name__ == "__main__":
    file_name = "Allocated_Seats_Data_Sem.txt"