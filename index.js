import axios from "axios";
import fs from "fs";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const polishAlphabet = [
    'A', 'Ą', 'B', 'C', 'Ć', 'D', 'E', 'Ę', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'Ł',
    'M', 'N', 'Ń', 'O', 'Ó', 'P', 'R', 'S', 'Ś', 'T', 'U', 'W', 'Y', 'Z', 'Ź', 'Ż'
];

const getItems = async (kind, filename) => {
    let results = [];

    for (let letter of polishAlphabet) {
        try {
            const apiUrl = `https://plan.zut.edu.pl/schedule.php?kind=${kind}&query=` + letter;
            console.log(apiUrl);
            const response = await axios.get(apiUrl);
            let data = response.data;

            try {
                if (typeof data === "string") {
                    data = JSON.parse(data);
                }
            } catch (parseError) {
                console.error(`Warning: data for letter ${letter} is not valid JSON.`);
                console.log(`Received data: ${data.slice(0, 100)}...`);
                continue;
            }

            if (Array.isArray(data)) {
                const filteredResults = data.filter(teacher => teacher && teacher.item);
                results = [...results, ...filteredResults];
            }
        } catch (error) {
            console.error("Error fetching data for letter:", letter, error.message);
        }
    }
    const uniqueResults = results.filter((obj, index, self) =>
        index === self.findIndex((el) => el.item === obj.item)
    );
    fs.writeFileSync(filename, JSON.stringify(uniqueResults, null, 2));
}

const getSchedule = async (teachers) => {

    let schedule = [];

    for (let teacher of teachers) {

        try {
            const apiUrl = `https://plan.zut.edu.pl/schedule_student.php?teacher=${teacher.item.replace(" ", "+")}&start=2024-09-25T00%3A00%3A00%2B02%3A00&end=2025-02-27T00%3A00%3A00%2B01%3A00`
            console.log(apiUrl)
            const response = await axios.get(apiUrl);
            let data = response.data;

            try {
                if (typeof data === "string") {
                    data = JSON.parse(data);
                }
            } catch (parseError) {
                console.error(`Warning: data for letter ${letter} is not valid JSON.`);
                console.log(`Received data: ${data.slice(0, 100)}...`);
                continue;
            }

            if (Array.isArray(data)) {
                const filteredSchedule = data.filter(event => event && event.title);
                schedule = [...schedule, ...filteredSchedule];
            }
        } catch (error) {
            console.error("Error fetching data for letter:", letter, error.message);
        }
    }


    fs.writeFileSync("schedule.json", JSON.stringify(schedule, null, 2));
};

const getTeachers = async () => {
    await getItems("teacher", "teachers.json");
};


const getClassrooms = async () => {
    await getItems("room", "classrooms.json");
};

const getSubjects = async () => {
    await getItems("subject", "subjects.json");
};

const getBuildings = async () => {
    try {
        const classrooms = JSON.parse(fs.readFileSync("classrooms.json", "utf-8"));
        const buildings = classrooms.map(classroom => classroom.item.split(" ")[0]);
        const objectBuildings = buildings.map(building => ({ item: building }));
        const uniqueBuildings = objectBuildings.filter((obj, index, self) =>
            index === self.findIndex((el) => el.item === obj.item)
        );
        fs.writeFileSync("buildings.json", JSON.stringify(uniqueBuildings, null, 2));
    } catch (error) {
        console.error("Error fetching data for buildings:", error.message);
    }
};

// API have not enough groups info
const getGroups = async () => {  
    await getItems("group", "groups.json");
};

const modifyClassrooms = async () => {
    try {
        const classrooms = JSON.parse(fs.readFileSync("classrooms.json", "utf-8"));
        classrooms.forEach(classroom => {
            classroom.building = classroom.item.split(" ")[0];
        });
        fs.writeFileSync("classrooms.json", JSON.stringify(classrooms, null, 2));
    } catch (error) {
        console.error("Error fetching data for buildings:", error.message);
    }
};

const initializeDB = async () => {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    try {
        await db.exec("CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT)");
        await db.exec("CREATE TABLE IF NOT EXISTS classrooms (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT, building TEXT)");
        await db.exec("CREATE TABLE IF NOT EXISTS buildings (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT)");
        await db.exec("CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT)");
        await db.exec("CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT)");
        await db.exec("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT, groupNumber TEXT)");
        await db.exec("CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, start TEXT, end TEXT,description TEXT, workerTitle TEXT, worker TEXT, room TEXT, groupName TEXT, tokName, lessonForm, lessonFormShort TEXT, lessonStatus TEXT, color TEXT)");
        return db;
    } catch (error) {
        console.error("Error initializing DB:", error.message);
    }
}

const putDataIntoDB = async (filename, table, db) => {
    try {
        const items = JSON.parse(fs.readFileSync(filename, "utf-8"));
        const batchSize = 300;
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const placeholders = batch.map(() => '(?)').join(', ');
            const values = batch.flatMap(item => [item.item]);
            const sql = `INSERT INTO ${table} (item) VALUES ${placeholders}`;
            await db.run(sql, values);
        }
        console.log("Inserted", items.length, "items into", table);
    } catch (error) {
        console.error("Error putting data into DB:", error.message);
    }
}

const putClassroomsIntoDB = async (filename, table, db) => {
    try {
        const items = JSON.parse(fs.readFileSync(filename, "utf-8"));
        const batchSize = 300;
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const placeholders = batch.map(() => '(?, ?)').join(', ');
            const values = batch.flatMap(item => [item.item, item.building]);
            const sql = `INSERT INTO ${table} (item, building) VALUES ${placeholders}`;
            await db.run(sql, values);
        }
        console.log("Inserted", items.length, "items into", table);
    } catch (error) {
        console.error("Error putting data into DB:", error.message);
    }
}

const putScheduleIntoDB = async (filename, table, db) => {
    try {
        const items = JSON.parse(fs.readFileSync(filename, "utf-8"));
        const batchSize = 300;

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            const values = batch.flatMap(item => [
                item.title,
                item.start,
                item.end,
                item.description,
                item.worker_title,
                item.worker,
                item.room,
                item.group_name,
                item.tok_name,
                item.lesson_form,
                item.lesson_form_short,
                item.lesson_status,
                item.color,
            ]);

            const sql = `
                INSERT INTO ${table} 
                (title, start, end, description, workerTitle, worker, room, groupName, tokName, lessonForm, lessonFormShort, lessonStatus, color)
                VALUES ${placeholders}
            `;

            await db.run(sql, values);
        }

        console.log("Inserted", items.length, "items into", table);
    } catch (error) {
        console.error("Error putting data into DB:", error.message);
    }
};


(async () => {
    await getTeachers();
    console.time("Fetching data and putting into DB");
    const teachers = JSON.parse(fs.readFileSync("teachers.json", "utf-8"));
    await getSchedule(teachers);
    await getClassrooms();
    await getBuildings();
    await getTeachers();
    await getSubjects();
    await modifyClassrooms();
    await getBuildings();
    const db = await initializeDB();
    // await getGroups();
    // await putDataIntoDB("groups.json", "groups", db);
    await putDataIntoDB("buildings.json", "buildings", db);
    await putDataIntoDB("subjects.json", "subjects", db);
    await putDataIntoDB("teachers.json", "teachers", db);
    await putClassroomsIntoDB("classrooms.json", "classrooms", db);
    await putScheduleIntoDB("schedule.json", "schedule", db);
    console.timeEnd("Fetching data and putting into DB");
})();
