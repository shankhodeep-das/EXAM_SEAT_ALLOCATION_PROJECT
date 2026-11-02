import itertools
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

room_capacity = [30, 40, 50]
special_room_capacity = [3, 4]

# Step 1: Generate all 625 unique name combinations using itertools.product
unique_names = [
    f"{f} {l}" for f, l in itertools.product(first_names, last_names)
]

# Shuffle them so they appear in a random, mixed order
random.shuffle(unique_names)

script_dir = os.path.dirname(__file__)
file_path = os.path.join(script_dir, "Exam_Room_Details.txt")

no_of_lines = 625

print(f"Generating {no_of_lines} exam room records with unique names...")

with open(file_path, "w", encoding="utf-8") as f:
  for i in range(1, no_of_lines + 1):
    room_no = f"R-{i:03d}"
    room_capacity_value = random.choice(room_capacity)

    # Step 2: Cycle through the unique names pool safely using modulo
    invigilator_name = unique_names[(i - 1) % len(unique_names)]

    special_room_capacity_value = random.choice(special_room_capacity)

    line = f"{room_no},{room_capacity_value},{invigilator_name},{special_room_capacity_value}\n"
    f.write(line)

print(
    f"Successfully generated {no_of_lines} records in Exam_Room_Details.txt!"
)