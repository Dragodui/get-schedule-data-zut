# Get Schedule to SQLite from ZUT Api

## Overview

This script fetches, processes, and stores data from the [ZUT scheduling API](https://plan.zut.edu.pl) for teachers, classrooms, subjects, schedules, and other related entities. It saves this data in JSON files and populates a SQLite database for further use.

---

## Features

1. **Fetch Data:**
   - Retrieves data for teachers, classrooms, subjects, and schedules from the ZUT API.
   - Extracts unique items and stores them in JSON files.

2. **Process Data:**
   - Filters and organizes data for clarity and consistency.
   - Derives additional information, such as building names from classrooms.

3. **Store Data in SQLite:**
   - Initializes a SQLite database with structured tables for teachers, classrooms, subjects, schedules, and more.
   - Inserts the processed data into the database.

4. **Customizable:**
   - Modular design allows adding more data types or processing logic.

---

## Prerequisites

- **Node.js**: Install [Node.js](https://nodejs.org).
- **SQLite**: Install SQLite for database management.
- **Dependencies**:
  ```bash
  npm install axios sqlite3
  ```

---

## Usage

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Script

Execute the script to fetch data, process it, and populate the database:

```bash
node script.js
```

---

## File Outputs

The script generates the following files:

- **teachers.json**: List of teachers.
- **classrooms.json**: List of classrooms with building names.
- **subjects.json**: List of subjects.
- **schedule.json**: Schedule details for teachers.
- **buildings.json**: List of unique building names.

---

## Database Structure

| Table       | Columns                                                                                                                                   |
|-------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **teachers** | `id`, `item`                                                                                                                             |
| **classrooms** | `id`, `item`, `building`                                                                                                                |
| **buildings** | `id`, `item`                                                                                                                             |
| **subjects** | `id`, `item`                                                                                                                             |
| **schedule** | `id`, `title`, `start`, `end`, `description`, `workerTitle`, `worker`, `room`, `groupName`, `tokName`, `lessonForm`, `lessonFormShort`, `lessonStatus`, `color` |

---

