from collections import defaultdict, deque
import os

script_dir = os.path.dirname(__file__)
Student_file_path = os.path.join(
    script_dir, "..", "STUDENTS_SECTION", "Students_Data.txt"
)
room_file_path = os.path.join(
    script_dir, "..", "EXAM_SECTION", "Exam_Room_Details.txt"
)
allocation_file_path = os.path.join(
    script_dir, "..", "SEAT_SECTION", "Allocated_Seats_Data.txt"
)


