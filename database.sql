DROP TABLE IF EXISTS census_data;
DROP TABLE IF EXISTS vaccinations;
DROP TABLE IF EXISTS scheme_applications;
DROP TABLE IF EXISTS scheme_enrollments;
DROP TABLE IF EXISTS welfare_schemes;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS panchayat_employees;
DROP TABLE IF EXISTS land_records;
DROP TABLE IF EXISTS households;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS citizens;

CREATE TABLE citizens (
	citizen_id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	gender TEXT NOT NULL,
	dob DATE NOT NULL,
	household_id INTEGER,
	educational_qualification TEXT
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'employee', 'citizen', 'monitor')) NOT NULL,
    citizen_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refresh_token TEXT,
    access_token TEXT,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);

CREATE TABLE households (
	household_id INTEGER PRIMARY KEY,
	address TEXT NOT NULL,
	income DECIMAL(10,2)
);


CREATE TABLE land_records (
	land_id INTEGER PRIMARY KEY,
	citizen_id INTEGER,
	area_acres DECIMAL(10,2) NOT NULL,
	crop_type TEXT,
	FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);


CREATE TABLE panchayat_employees (
	employee_id INTEGER PRIMARY KEY,
	citizen_id INTEGER,
	role TEXT NOT NULL,
	FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);


CREATE TABLE assets (
	asset_id INTEGER PRIMARY KEY,
	type TEXT NOT NULL,
	location TEXT NOT NULL,
	installation_date DATE
);


CREATE TABLE welfare_schemes (
	scheme_id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	status BOOLEAN,
	expiry_date TIMESTAMP
);


CREATE TABLE scheme_enrollments (
	enrollment_id INTEGER PRIMARY KEY,
	citizen_id INTEGER,
	scheme_id INTEGER,
	enrollment_date DATE,
	FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id),
	FOREIGN KEY (scheme_id) REFERENCES welfare_schemes(scheme_id)
);


CREATE TABLE vaccinations (
	vaccination_id INTEGER PRIMARY KEY,
	citizen_id INTEGER,
	vaccine_type TEXT NOT NULL,
	date_administered DATE,
	FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);

CREATE TABLE census_data (
	household_id INTEGER,
	citizen_id INTEGER,
	event_type TEXT NOT NULL,
	event_date DATE,
	PRIMARY KEY (household_id, citizen_id, event_type, event_date),
	FOREIGN KEY (household_id) REFERENCES households(household_id),
	FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);

CREATE TABLE scheme_applications(
	citizen_id INTEGER,
	scheme_id INTEGER,
	PRIMARY KEY (citizen_id, scheme_id),
	FOREIGN KEY (scheme_id) REFERENCES welfare_schemes(scheme_id),
	FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);


INSERT INTO citizens (citizen_id, name, gender, dob, household_id, educational_qualification) VALUES (0, 'Harshit Singh', 'Male', '2004-03-14', 0, 'Graduate');

INSERT INTO users (user_id, username, password, role, citizen_id, refresh_token, access_token) VALUES (1, 'admin', '$2a$10$vfgEk9MB1IVb.5ylr7XrIOEfMOUtDXODoP/wql9Q03YuLXxO9AAzG', 'admin', 0, NULL, NULL);
