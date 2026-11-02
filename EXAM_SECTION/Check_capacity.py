import os

def check_capacity(target_room):
    script_dir = os.path.dirname(__file__)
    file_path = os.path.join(script_dir, "Exam_Room_Details.txt")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if "," not in line.strip():
                    continue
                
                parts = line.split(",")
                if target_room.strip().upper() == parts[0].strip().upper():
                    capacity = parts[1].strip()
                    print(f"Capacity for {target_room}: {capacity}")
                    return capacity
                    
        print(f"Room {target_room} not found")
        return None
    except FileNotFoundError:
        print(f"Error: Could not find 'Exam_Room_Details.txt' in {script_dir}")
        return None

if __name__ == "__main__":
    check_capacity()