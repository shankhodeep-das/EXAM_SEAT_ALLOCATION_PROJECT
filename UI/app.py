import customtkinter as ctk
import os

script_dir = os.path.dirname(__file__)
Student_file_path = os.path.join(
    script_dir, "..", "STUDENTS_SECTION", "Students_Data.txt"
)
room_file_path = os.path.join(
    script_dir, "..", "EXAM_SECTION", "Exam_Room_Details.txt"
)
user_input_file_path = os.path.join(
    script_dir, "..", "UI", "User_Input_Data.txt"
)

class SeatingArrangement(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.geometry("800x600")
        self.title("Seating Arrangement")
        self.sidebar = ctk.CTkFrame(self, width=160, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")
        self.content = ctk.CTkFrame(self, fg_color="transparent")
        self.content.pack(side="right", fill="both", expand=True, padx=20, pady=20)
        self.btn_view_std= ctk.CTkButton(self.sidebar, text="View Students", command=self.show_students_data)
        self.btn_view_std.pack(padx=15, pady=10, fill="x")
        self.btn_view_room = ctk.CTkButton(self.sidebar, text="View Rooms", command=self.show_rooms_data)
        self.btn_view_room.pack(padx=15, pady=10, fill="x")
        self.btn_add_std = ctk.CTkButton(self.sidebar, text="Add Student", command=self.add_student)
        self.btn_add_std.pack(padx=15, pady=10, fill="x")
        self.show_blank()

    def clear_content(self):
        for widget in self.content.winfo_children():
            widget.destroy()
    def show_blank(self):
        self.clear_content()
        title = ctk.CTkLabel(self.content, text="Welcome to Seating Arrangement App", font=("Arial", 18, "bold"))
        title.pack(anchor="center", pady=(0, 10))
        info = ctk.CTkLabel(self.content, text="Use the sidebar to navigate through the app.", font=("Arial", 14))
        info.pack(anchor="center", pady=(0, 10))
    def show_students_data(self):
        self.clear_content()
        title = ctk.CTkLabel(self.content, text="Student Records", font=("Arial", 18, "bold"))
        title.pack(anchor="w", pady=(0, 10))
        total = ctk.CTkLabel(self.content, text=f"Total Students: 0", font=("Arial", 14))
        total.pack(anchor="w", pady=(0, 10))
        self.textbox = ctk.CTkTextbox(self.content, width=500, height=300)
        self.textbox.pack(fill="both", expand=True)
        try:
            with open(Student_file_path, "r", encoding="utf-8") as file:
                file_data = file.read()
            self.textbox.insert("0.0", file_data)
            total.configure(text=f"Total Students: {file_data.count('BWU')}")
        except FileNotFoundError:
            self.textbox.insert("0.0", "No records found. Add a student first!")
    def show_rooms_data(self):
        self.clear_content()
        title = ctk.CTkLabel(self.content, text="Room Records", font=("Arial", 18, "bold"))
        title.pack(anchor="w", pady=(0, 10))
        total = ctk.CTkLabel(self.content, text=f"Total Rooms: 0", font=("Arial", 14))
        total.pack(anchor="w", pady=(0, 10))
        self.textbox = ctk.CTkTextbox(self.content, width=500, height=300)
        self.textbox.pack(fill="both", expand=True)
        try:
            with open(room_file_path, "r", encoding="utf-8") as file:
                file_data = file.read()
            self.textbox.insert("0.0", file_data)
            total.configure(text=f"Total Rooms: {file_data.count('R-')}")
        except FileNotFoundError:
            self.textbox.insert("0.0", "No records found. Add a room first!")
    def add_student(self):
        self.clear_content()
        title = ctk.CTkLabel(self.content, text="Add Student", font=("Arial", 18, "bold"))
        title.pack(anchor="w", pady=(0, 10))
        roll_input = ctk.CTkEntry(self.content, placeholder_text="Enter Student Roll Number (BWU/BCA/25/071)")
        roll_input.pack(anchor="w", pady=(0, 10))
        name_input = ctk.CTkEntry(self.content, placeholder_text="Enter Student Name")
        name_input.pack(anchor="w", pady=(0, 10))
        sec_input = ctk.CTkEntry(self.content, placeholder_text="Enter Student Section")
        sec_input.pack(anchor="w", pady=(0, 10))
        

def run_app():
    app = SeatingArrangement()
    app.mainloop()

if __name__ == "__main__":
    run_app()