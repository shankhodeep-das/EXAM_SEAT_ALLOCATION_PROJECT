
import os
import random
# Building distribution
buildings = {
    "UB1": 209,
    "UB2": 208,
    "UB3": 208
}

# Existing SeatWise room layouts
room_layouts = [
    (6, 5),
    (5, 10),
    (10, 6)
]
special_seat_quantity = [
    3,5,6,7
]
script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, "Exam_Room_Details.txt")

total_rooms = sum(buildings.values())

print(f"Generating {total_rooms} room records...")

with open(file_path, "w", encoding="utf-8") as file:

    for building_code, room_count in buildings.items():

        # Start after the existing 75 rooms
        existing_room_count = {
            "UB1": 80,
            "UB2": 75,
            "UB3": 70
        }

        start_number = existing_room_count[building_code]

        for i in range(1, room_count + 1):

            room_number = start_number + i

            rows, columns = room_layouts[
                (room_number - 1) % len(room_layouts)
            ]

            line = (
                f"{building_code}|"
                f"ROOM-{room_number:03d}|"
                f"{rows}|"
                f"{columns}|"
                f"{random.choice(special_seat_quantity)}\n"
            )

            file.write(line)

print(f"Successfully generated {total_rooms} room records!")
print(f"File saved at: {file_path}")
