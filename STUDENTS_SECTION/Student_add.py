import os

script_dir = os.path.dirname(__file__)
file_path = os.path.join(script_dir, "Students_Data.txt")
def add_students():
    St_Roll = input("Enter Student Roll Number (BWU/BCA/25/071) : ")
    St_Name = input("Enter Student Name: ")
    St_Sec = input("Enter Student Section: ")
    St_Subject_Number = int(input("Enter number of Subjects: "))
    St_Prefeered_Room = input("Preferred Room (Y/N): ")
    St_Req_Status = input("Special Requirement Status (Y/N): ")
    if St_Roll == "" or St_Name == "" or St_Sec == "" or St_Subject_Number == "" or St_Prefeered_Room == "" or St_Req_Status == "":
        print("Please Enter Valid input....")
        return
    elif St_Prefeered_Room=="y" or St_Prefeered_Room=="Y":
        St_Prefeered_Room = True
    elif St_Prefeered_Room=="n" or St_Prefeered_Room=="N":
        St_Prefeered_Room = False
    else:
        print("Please Enter Valid input....")
    if St_Req_Status=="y" or St_Req_Status=="Y":
        St_Req_Status = True
    elif St_Req_Status=="n" or St_Req_Status=="N":
        St_Req_Status = False
    else:
        print("Please Enter Valid input....")
    St_Subject_List = []
    for i in range(St_Subject_Number):
        Sub_name=input(f"Enter Subject number {i+1}: ")
        St_Subject_List.append(Sub_name)
    subjects_str = ",".join(St_Subject_List)
    with open(file_path, "a") as file:
        file.write(f"{St_Roll},{St_Name},{St_Sec},{subjects_str},{St_Prefeered_Room},{St_Req_Status}\n")
    print("Student data inserted succesfully...")

if __name__=="__main__":
    add_students()