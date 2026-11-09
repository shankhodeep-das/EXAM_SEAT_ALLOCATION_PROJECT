
import os
import random
import uuid

first_names = [
    "Aarav", "Vivaan", "Aditya", "Diya", "Kabir",
    "Ananya", "Rohan", "Priya", "Arjun", "Sneha",
    "Rahul", "Neha", "Amit", "Pooja", "Kunal",
    "Riya", "Sayan", "Megha", "Abhishek", "Tanvi",
    "Sourav", "Puja", "Dev", "Ishita", "Manish"
]

last_names = [
    "Sharma", "Gupta", "Verma", "Patel", "Singh",
    "Roy", "Das", "Sen", "Mehta", "Ghosh",
    "Kumar", "Mukherjee", "Chatterjee", "Banerjee",
    "Paul", "Dey", "Bose", "Naskar", "Pradhan",
    "Mondal", "Tiwari", "Joshi", "Rao", "Menon"
]

sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]


brainware_courses = [
    "B.Tech (Computer Science & Engineering)",
    "B.Tech (CSE - Artificial Intelligence & Machine Learning)",
    "B.Tech (CSE - Cyber Security)",
    "B.Tech (CSE - Data Science & AI)",
    "B.Tech (CSE - AI & Robotics)",
    "B.Tech (Biotechnology)",
    "BCA (Bachelor of Computer Applications)",
    "BCA (Artificial Intelligence & Machine Learning)",
    "B.Sc. (Hons.) in Advanced Networking & Cyber Security",
    "B.Sc. (Hons.) in Agriculture",
    "B.Sc. (Hons.) in Biotechnology",
    "B.Sc. (Hons.) in Food, Nutrition & Dietetics",
    "B.Sc. (Hons.) in Psychology",
    "B.Sc. (Hons.) in Animation & VFX",
    "B.Sc. (Hons.) in Media Science & Journalism",
    "B.Sc. in Nursing",
    "BBA (Bachelor of Business Administration)",
    "BBA (Business Analytics)",
    "BBA (Digital Marketing)",
    "BBA (Hospital Management)",
    "B.Com (Hons.) in Banking & Finance",
    "B.Pharm (Bachelor of Pharmacy)",
    "BPT (Bachelor of Physiotherapy)",
    "B.Optom (Bachelor of Optometry)",
    "B.Sc. in Medical Laboratory Technology (BMLT)",
    "B.Sc. in Operation Theatre Technology (BOTT)",
    "B.Sc. in Critical Care Technology",
    "B.Sc. in Physician Assistant (BPA)",
    "B.A. (Hons.) in Applied English",
    "LL.B. (Bachelor of Laws)",
    "B.A. LL.B. (Hons.)",
    "BBA LL.B. (Hons.)",
    "M.Tech (Computer Science & Engineering)",
    "M.Tech (Robotics & Automation)",
    "MCA (Master of Computer Applications)",
    "M.Sc. in Cyber Security / Advanced Networking",
    "M.Sc. in Biotechnology",
    "M.Sc. in Food & Nutrition",
    "M.Sc. in Mathematics",
    "M.Sc. in Agriculture",
    "M.Sc. in Media Science",
    "MBA (Master of Business Administration)",
    "MBA in Hospital & Healthcare Management",
    "M.Com (Master of Commerce)",
    "M.Pharm (Master of Pharmacy)",
    "M.Optom (Master of Optometry)",
    "M.A. in English",
    "LL.M. (Master of Laws)",
    "Diploma in Computer Science & Engineering",
    "Diploma in Mechanical Engineering",
    "Diploma in Electrical Engineering",
    "D.Pharm (Diploma in Pharmacy)",
    "DMLT (Diploma in Medical Laboratory Technology)",
    "GNM (General Nursing & Midwifery)",
    "Ph.D."
]
# Number of new students to generate per course
no_of_students = 200

# Semester 1 is valid for every course
semester = 1

script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, "Students_Data.txt")

print(f"Generating {no_of_students} students per course...")

with open(file_path, "w", encoding="utf-8") as file:
    for course in brainware_courses:
        for _ in range(no_of_students):

            full_name = (
                f"{random.choice(first_names)} "
                f"{random.choice(last_names)}"
            )

            email_id = f"student_{uuid.uuid4().hex[:12]}@seatwise.demo"

            section = random.choice(sections)

            # Generate a unique temporary password
            password = f"SW@{uuid.uuid4().hex[:10]}"

            special_req = random.choice([True, False])
            special_seat_req = random.choice([True, False])

            line = (
                f"{full_name}|{email_id}|{section}|{semester}|"
                f"{course}|{password}|{str(special_req).lower()}|"
                f"{str(special_seat_req).lower()}\n"
            )

            file.write(line)

print(f"Generated {len(brainware_courses) * no_of_students} records.")
print(f"File saved at: {file_path}")
