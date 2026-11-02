import os

def view_students():
    script_dir = os.path.dirname(__file__)
    file_path = os.path.join(script_dir, "Students_Data.txt")
    batch_size = 30
    try:
        with open(file_path, "r") as file:
            count = 0
            for line in file:
                parts = line.split(",")
                print(f'''
                    \n
                    {count + 1}. Roll Number: {parts[0].strip()}, 
                        Name: {parts[1].strip()},  
                        Section: {parts[2].strip()}\n
                    ''')
                count += 1
                if count % batch_size == 0:
                    choice = input("\n--- Press Enter for next page, or type 'q' to stop: ---").strip().lower()
                    if choice == 'q':
                        break
            print("\n--- End of student records ---")
            
    except FileNotFoundError:
        print("Students_Data.txt not found.")

if __name__ == "__main__":
    view_students()