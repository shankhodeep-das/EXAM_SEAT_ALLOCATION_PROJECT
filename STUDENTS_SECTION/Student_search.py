import os


def Student_Search():
  target_roll = (
      input("Enter Roll Number to search (e.g., BWU/BCA/25/0050000): ")
      .strip()
      .upper()
  )

  try:
    target_id = int(target_roll.split("/")[-1])
  except ValueError:
    print(
        "Invalid format! Please enter a valid roll number like"
        " BWU/BCA/25/0050000"
    )
    return

  script_dir = os.path.dirname(__file__)
  file_path = os.path.join(script_dir, "Students_Data.txt")

  if not os.path.exists(file_path):
    print("Students_Data.txt not found. Please generate the data first.")
    return

  print(f"\nSearching for {target_roll}(using Interpolation Search)...")

  with open(file_path, "rb") as f:
    f.seek(0, os.SEEK_END)
    file_size = f.tell()

    total_records = 1000000

    if target_id < 1 or target_id > total_records:
      print("Roll Number is out of bounds (Range: 0000001 to 1000000).")
      return
    
    avg_bytes_per_record = file_size / total_records
    estimated_pos = int((target_id - 1) * avg_bytes_per_record)


    low = max(0, estimated_pos - 4000)
    high = min(
        file_size, estimated_pos + 4000
    )

    found_line = None


    f.seek(low)
    if low != 0:
      f.readline()

    while low <= high:
      mid = (low + high) // 2
      f.seek(mid)
      if mid != 0:
        f.readline()
        current_pos = f.tell()
      else:
        f.seek(0)
        current_pos = 0

      if current_pos >= file_size or current_pos > high:
        break

      line_bytes = f.readline()
      if not line_bytes:
        break

      line_str = line_bytes.decode("utf-8", errors="ignore").strip()
      if not line_str:
        continue

      parts = line_str.split(",")
      current_roll = parts[0].strip().upper()

      try:
        current_id = int(current_roll.split("/")[-1])
      except ValueError:
        continue

      if current_id == target_id:
        found_line = line_str
        break
      elif current_id < target_id:
        low = f.tell()
      else:
        high = mid - 1

    if found_line:
      parts = found_line.split(",")
      print("\n--- Student Found Successfully! ---")
      print(f"Roll Number : {parts[0]}")
      print(f"Name        : {parts[1]}")
      print(f"Section     : {parts[2]}")
      print(f"Subjects    : {parts[3]}, {parts[4]}, {parts[5]}, {parts[6]}")
      print(f"Pref. Room  : {"YES" if parts[7].strip() == "True" else "NO"}")
      print(f"Req. Status : {"YES" if parts[7].strip() == "True" else "NO"}")
    else:
      print("\nStudent Roll Number not found in records.")


if __name__ == "__main__":
  Student_Search()