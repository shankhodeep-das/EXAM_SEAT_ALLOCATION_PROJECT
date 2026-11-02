import os
import random

first_names = [
    "Aarav",
    "Vivaan",
    "Aditya",
    "Diya",
    "Kabir",
    "Ananya",
    "Rohan",
    "Priya",
    "Arjun",
    "Sneha",
    "Rahul",
    "Neha",
    "Amit",
    "Pooja",
    "Kunal",
    "Riya",
    "Sayan",
    "Megha",
    "Abhishek",
    "Tanvi",
    "Sourav",
    "Puja",
    "Dev",
    "Ishita",
    "Manish",
]
last_names = [
    "Sharma",
    "Gupta",
    "Verma",
    "Patel",
    "Singh",
    "Roy",
    "Das",
    "Sen",
    "Mehta",
    "Ghosh",
    "Kumar",
    "Mukherjee",
    "Chatterjee",
    "Banerjee",
    "Paul",
    "Dey",
    "Bose",
    "Naskar",
    "Pradhan",
    "Mondal",
    "Tiwari",
    "Joshi",
    "Rao",
    "Tivary",
    "Menon",
]

sections = ["A", "B", "C","D", "E", "F", "G", "H", "I", "J"]

no_of_sections = [1,2,3,4,5,6]

subjects_pool = [
    "Math",
    "Physics",
    "Chemistry",
    "Biology",
    "Computer",
    "English",
    "Python",
    "Data Structures",
    "Database",
    "Networks",
    "Algorithms",
    "Java",
    "C++",
    "Web Dev",
    "Operating Systems",
    "Statistics",
    "Cyber Security",
    "Cloud Computing",
]

brainware_courses= [
    "BTECH(CSE)",
    "BTECH(CSE_AI/ML)",
    "BTECH(CSE_CYBER_SECURITY)",
    "BTECH(CSE_DATA_SCIENCE_AI)",
    "BTECH(CSE_AI_ROBOTICS)",
    "BTECH(BIOTECH)",
    "BCA",
    "BCA(AI/ML)",
    "BSC(NETWORKING_CYBER_SECURITY)",
    "BSC(AGRICULTURE)",
    "BSC(BIOTECH)",
    "BSC(NUTRITION_DIETETICS)",
    "BSC(PSYCHOLOGY)",
    "BSC(ANIMATION_VFX)",
    "BSC(MEDIA_JOURNALISM)",
    "BSC(NURSING)",
    "BBA",
    "BBA(BUSINESS_ANALYTICS)",
    "BBA(DIGITAL_MARKETING)",
    "BBA(HOSPITAL_MGMT)",
    "BCOM(BANKING_FINANCE)",
    "BPHARM",
    "BPT",
    "BOPTOM",
    "BSC(BMLT)",
    "BSC(BOTT)",
    "BSC(CRITICAL_CARE)",
    "BSC(PA)",
    "BA(ENGLISH)",
    "LLB",
    "BA_LLB",
    "BBA_LLB",
    "MTECH(CSE)",
    "MTECH(ROBOTICS_AUTOMATION)",
    "MCA",
    "MSC(CYBER_SECURITY)",
    "MSC(BIOTECH)",
    "MSC(FOOD_NUTRITION)",
    "MSC(MATHS)",
    "MSC(AGRICULTURE)",
    "MSC(MEDIA)",
    "MBA",
    "MBA(HOSPITAL_HEALTHCARE)",
    "MCOM",
    "MPHARM",
    "MOPTOM",
    "MA(ENGLISH)",
    "LLM",
    "DIPLOMA(CSE)",
    "DIPLOMA(ME)",
    "DIPLOMA(EE)",
    "DPHARM",
    "DMLT",
    "GNM",
    "PHD",
]




script_dir = os.path.dirname(__file__)
file_path = os.path.join(script_dir, "Students_Data.txt")

no_of_lines = 200



print(f"Generating {no_of_lines} student records... Please wait.")

with open(file_path, "w", encoding="utf-8") as f:
  for i in range(len(brainware_courses)):
    for k in range(no_of_lines):
        roll_no = f"BWU/{brainware_courses[i]}/25/{k+1:03d}"
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        section = f"{random.choice(sections)}"
        sub1, sub2, sub3, sub4 = random.sample(subjects_pool, 4)

        pref_room = random.choice([True, False])
        req_status = random.choice([True, False])
        line = f"{roll_no},{name},{section},{sub1},{sub2},{sub3},{sub4},{pref_room},{req_status}\n"
        f.write(line)

print(f"Successfully generated {no_of_lines} records!")