import customtkinter as ctk
import os
from tkinter import ttk

from matplotlib.pyplot import title

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
        self.btn_search_std = ctk.CTkButton(self.sidebar, text="Search Student", command=self.search_student)
        self.btn_search_std.pack(padx=15, pady=10, fill="x")
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
        self.clear_content()  # Wipe old screen
        
        # Title
        title = ctk.CTkLabel(self.content, text="Student Records", font=("Arial", 18, "bold"))
        title.pack(anchor="w", pady=(0, 5))
        
        # Total Students Label
        self.total_label = ctk.CTkLabel(self.content, text="Total Students: 0", font=("Arial", 12))
        self.total_label.pack(anchor="w", pady=(0, 10))
        
        # --- CREATE TABLE (TTK TREEVIEW) ---
        # Define your table columns based on your comma-separated data structure
        columns = ("Roll No", "Name", "Section", "Subject 1", "Subject 2", "Subject 3", "Subject 4", "Preferred Room", "Special Req.")
        
        # Style the Treeview to match dark/light mode if desired
        style = ttk.Style()
        style.theme_use("default")
        style.configure("Treeview", 
                        background="#2a2d2e", 
                        foreground="white", 
                        rowheight=25, 
                        fieldbackground="#2a2d2e",
                        bordercolor="#343638", 
                        borderwidth=0)
        style.configure("Treeview.Heading", 
                        background="#1f538d", 
                        foreground="white", 
                        relief="flat")
        style.map("Treeview.Heading", background=[('active', '#14375e')])

        # Create Frame to hold table and scrollbar
        table_frame = ctk.CTkFrame(self.content, fg_color="transparent")
        table_frame.pack(fill="both", expand=True)

        # Scrollbar
        tree_scroll = ctk.CTkScrollbar(table_frame)
        tree_scroll.pack(side="right", fill="y")

        # Treeview Widget
        self.tree = ttk.Treeview(table_frame, columns=columns, show="headings", yscrollcommand=tree_scroll.set)
        tree_scroll.configure(command=self.tree.yview)
        
        # Configure column headings and widths
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=130, anchor="w")

        self.tree.pack(side="left", fill="both", expand=True)

        # --- LOAD AND PARSE DATA FROM .TXT FILE ---
        file_path = "STUDENTS_SECTION/Students_Data.txt"  # Update path if needed
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                lines = file.readlines()
                
            count = 0
            for line in lines:
                line = line.strip()
                if line:
                    # Split the comma-separated line into individual values
                    data_values = line.split(",")
                    
                    # Insert row into the table
                    # (Ensures it doesn't crash if a line has fewer columns)
                    self.tree.insert("", "end", values=data_values)
                    count += 1
                    
            # Update total students count label
            self.total_label.configure(text=f"Total Students: {count}")
            
        except FileNotFoundError:
            self.total_label.configure(text="Total Students: 0 (File not found)")
    def show_rooms_data(self):
        self.clear_content()  # Wipe old screen
        
        # Title
        title = ctk.CTkLabel(self.content, text="Room Records", font=("Arial", 18, "bold"))
        title.pack(anchor="w", pady=(0, 5))
        
        # Total Rooms Label
        self.total_rooms_label = ctk.CTkLabel(self.content, text="Total Rooms: 0", font=("Arial", 12))
        self.total_rooms_label.pack(anchor="w", pady=(0, 10))
        
        # --- CREATE TABLE FOR ROOMS ---
        # Define columns based on your room data format (Room ID, Capacity, Invigilator, Floor/Block, etc.)
        columns = ("Room ID", "Capacity", "Invigilator Name", "Special Seats")
        
        # Style the Treeview (matches your dark theme)
        style = ttk.Style()
        style.theme_use("default")
        style.configure("Treeview", 
                        background="#2a2d2e", 
                        foreground="white", 
                        rowheight=25, 
                        fieldbackground="#2a2d2e",
                        bordercolor="#343638", 
                        borderwidth=0)
        style.configure("Treeview.Heading", 
                        background="#1f538d", 
                        foreground="white", 
                        relief="flat")
        style.map("Treeview.Heading", background=[('active', '#14375e')])

        # Frame to hold the table and scrollbar
        table_frame = ctk.CTkFrame(self.content, fg_color="transparent")
        table_frame.pack(fill="both", expand=True)

        # Scrollbar
        tree_scroll = ctk.CTkScrollbar(table_frame)
        tree_scroll.pack(side="right", fill="y")

        # Treeview Widget
        self.room_tree = ttk.Treeview(table_frame, columns=columns, show="headings", yscrollcommand=tree_scroll.set)
        tree_scroll.configure(command=self.room_tree.yview)
        
        # Configure column headings and widths
        for col in columns:
            self.room_tree.heading(col, text=col)
            self.room_tree.column(col, width=150, anchor="w")

        self.room_tree.pack(side="left", fill="both", expand=True)

        # --- LOAD AND PARSE DATA FROM ROOM .TXT FILE ---
        file_path = "EXAM_SECTION/Exam_Room_Details.txt"  # Your room data file path
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                lines = file.readlines()
                
            count = 0
            for line in lines:
                line = line.strip()
                if line:
                    # Split the comma-separated line into individual values
                    data_values = line.split(",")
                    
                    # Insert row into the table
                    self.room_tree.insert("", "end", values=data_values)
                    count += 1
                    
            # Update total rooms count label
            self.total_rooms_label.configure(text=f"Total Rooms: {count}")
            
        except FileNotFoundError:
            self.total_rooms_label.configure(text="Total Rooms: 0 (File not found)")
    def add_student(self):
        self.clear_content()
        title = ctk.CTkLabel(self.content, text="Add Student", font=("Arial", 18, "bold"))
        title.pack(anchor="w", pady=(0, 10))
        self.roll_input = ctk.CTkEntry(self.content, placeholder_text="Enter Student Roll Number (BWU/BCA/25/071)")
        self.roll_input.pack(anchor="w", pady=(0, 10))
        self.name_input = ctk.CTkEntry(self.content, placeholder_text="Enter Student Name")
        self.name_input.pack(anchor="w", pady=(0, 10))
        self.sec_input = ctk.CTkEntry(self.content, placeholder_text="Enter Student Section")
        self.sec_input.pack(anchor="w", pady=(0, 10))
        self.sub1_input = ctk.CTkEntry(self.content, placeholder_text="Enter Subject 1")
        self.sub1_input.pack(anchor="w", pady=(0, 10))
        self.sub2_input = ctk.CTkEntry(self.content, placeholder_text="Enter Subject 2")
        self.sub2_input.pack(anchor="w", pady=(0, 10))
        self.sub3_input = ctk.CTkEntry(self.content, placeholder_text="Enter Subject 3")
        self.sub3_input.pack(anchor="w", pady=(0, 10))
        self.sub4_input = ctk.CTkEntry(self.content, placeholder_text="Enter Subject 4")
        self.sub4_input.pack(anchor="w", pady=(0, 10))
        pref_label = ctk.CTkLabel(self.content, text="Select Preferred Room:", font=("Arial", 14))
        pref_label.pack(anchor="w", pady=(0, 10))
        self.pref_input_true = ctk.CTkRadioButton(self.content, text="True", value="True")
        self.pref_input_true.pack(anchor="w", pady=(0, 10))
        spec_label = ctk.CTkLabel(self.content, text="Select Special Requirement:", font=("Arial", 14))
        spec_label.pack(anchor="w", pady=(0, 10))
        self.spec_input_true = ctk.CTkRadioButton(self.content, text="Special", value="True")
        self.spec_input_true.pack(anchor="w", pady=(0, 10))
        submit_btn = ctk.CTkButton(self.content, text="Submit", command=lambda: self.save_student_data())
        submit_btn.pack(anchor="w", pady=(0, 10))
        self.status_label = ctk.CTkLabel(self.content, text="STATUS : Please fill up all fields.", font=("Arial", 14))
        self.status_label.pack(anchor="w", pady=(0, 10))
    def save_student_data(self):
        roll = self.roll_input.get()
        name = self.name_input.get()
        sec = self.sec_input.get()
        sub1 = self.sub1_input.get()
        sub2 = self.sub2_input.get()
        sub3 = self.sub3_input.get()
        sub4 = self.sub4_input.get()
        pref = "True" if self.pref_input_true == "True" else "False"
        spec = "True" if self.spec_input_true == "True" else "False"
        student_data = f"\n{roll},{name},{sec},{sub1},{sub2},{sub3},{sub4},{pref},{spec}"
        try:
            if not all([roll, name, sec, sub1, sub2, sub3, sub4, pref, spec]):
                self.status_label.configure(text="STATUS : Please fill in all fields.", text_color="red")
                return
            with open(Student_file_path, "r", encoding="utf-8") as file:
                existing_data = file.read()
                if roll in existing_data:
                    self.status_label.configure(text="STATUS : Student with this roll number already exists!", text_color="red")
                    return
            with open(Student_file_path, "a", encoding="utf-8") as file:
                file.write(student_data)
            self.status_label.configure(text="STATUS : Student added successfully!", text_color="green")
            self.roll_input.delete(0, "end")
            self.name_input.delete(0, "end")
            self.sec_input.delete(0, "end")
            self.sub1_input.delete(0, "end")
            self.sub2_input.delete(0, "end")
            self.sub3_input.delete(0, "end")
            self.sub4_input.delete(0, "end")
            self.pref_input_true.deselect()
            self.spec_input_true.deselect()
        except FileNotFoundError:
            self.status_label.configure(text="STATUS : Student data file not found. First create a new one.", text_color="red")
    def search_student(self):
        self.clear_content()
        top_frame = ctk.CTkFrame(self.content, fg_color="transparent")
        top_frame.pack(side="top", fill="x", pady=(0, 10))
        title = ctk.CTkLabel(top_frame, text="Search Student", font=("Arial", 18, "bold"))
        title.pack(anchor="w")
        middle_frame = ctk.CTkFrame(self.content, fg_color="transparent")
        middle_frame.pack(side="top", fill="both", expand=True, pady=10)
        self.roll_input = ctk.CTkEntry(middle_frame, placeholder_text="Please enter info of a student to search", width=300)
        self.roll_input.pack(anchor="w", pady=5)
        self.search_btn = ctk.CTkButton(middle_frame, text="Search", command=self.perform_search)
        self.search_btn.pack(anchor="w", pady=5)
        buttom_frame = ctk.CTkFrame(self.content, fg_color="transparent")
        buttom_frame.pack(side="bottom", fill="x", pady=(10, 0))
        self.result_textbox = ctk.CTkTextbox(middle_frame, width=500, height=500)
        self.result_textbox.pack(fill="both", expand=True)
    def perform_search(self):
        self.result_textbox.delete("0.0", "end")
        try:
            if not self.roll_input.get():
                self.result_textbox.insert("0.0", "Please enter info of a student to search.")
                return
            with open(Student_file_path, "r", encoding="utf-8") as file:
                existing_data = file.read()
                if self.roll_input.get() in existing_data:
                    for line in existing_data.splitlines():
                        if self.roll_input.get() in line:
                            self.result_textbox.insert("1.0", line + "\n")
        except Exception as e:
            self.result_textbox.insert("0.0", f"An error occurred: {e}")
def run_app():
    app = SeatingArrangement()
    app.mainloop()

if __name__ == "__main__":
    run_app()