DROP TABLE IF EXISTS census_data;
DROP TABLE IF EXISTS vaccinations;
DROP TABLE IF EXISTS scheme_applications;
DROP TABLE IF EXISTS scheme_enrollments;
DROP TABLE IF EXISTS welfare_schemes;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS panchayat_employees;
DROP TABLE IF EXISTS land_records;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS citizens;
DROP TABLE IF EXISTS households;

CREATE TABLE households (
    household_id INT PRIMARY KEY,
    address TEXT NOT NULL,
    income INT NOT NULL
);

CREATE TABLE citizens (
    citizen_id INT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    dob DATE NOT NULL,
    household_id INT,
    educational_qualification TEXT,
    FOREIGN KEY (household_id) REFERENCES households(household_id)
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

CREATE TABLE land_records (
    land_id INT PRIMARY KEY,
    citizen_id INT,
    area_acres DECIMAL(5, 2) NOT NULL,
    crop_type TEXT NOT NULL,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);


CREATE TABLE panchayat_employees (
    employee_id INT PRIMARY KEY,
    citizen_id INT,
    role TEXT NOT NULL,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);


CREATE TABLE assets (
    asset_id INT PRIMARY KEY,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    installation_date DATE NOT NULL
);


CREATE TABLE welfare_schemes (
    scheme_id INT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
	status BOOLEAN,
	expiry_date TIMESTAMP
);


CREATE TABLE scheme_enrollments (
    enrollment_id INT PRIMARY KEY,
    citizen_id INT,
    scheme_id INT,
    enrollment_date DATE NOT NULL,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id),
    FOREIGN KEY (scheme_id) REFERENCES welfare_schemes(scheme_id)
);


CREATE TABLE vaccinations (
    vaccination_id INT PRIMARY KEY,
    citizen_id INT,
    vaccine_type TEXT NOT NULL,
    date_administered DATE NOT NULL,
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);

CREATE TABLE census_data (
    household_id INT,
    citizen_id INT,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
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


-- Dummy Data
-- Insert households
INSERT INTO households (household_id, address, income) VALUES
(1, '123 Main St', 25000),
(2, '456 Oak Ave', 35000),
(3, '789 Pine Rd', 42000),
(4, '101 Maple Ln', 28000),
(5, '202 Cedar Blvd', 52000),
(6, '303 Elm St', 31000),
(7, '404 Birch Ave', 38000),
(8, '505 Walnut Rd', 44000),
(9, '606 Cherry Ln', 29000),
(10, '707 Spruce Way', 48000);

-- Insert citizens (20 entries)
INSERT INTO citizens (citizen_id, name, gender, dob, household_id, educational_qualification) VALUES
(1, 'Raj Kumar', 'Male', '1980-05-12', 1, 'Bachelor''s Degree'),
(2, 'Priya Singh', 'Female', '1982-09-23', 1, 'Master''s Degree'),
(3, 'Amit Patel', 'Male', '2010-02-15', 1, 'Elementary School'),
(4, 'Sunita Sharma', 'Female', '1975-11-30', 2, 'High School'),
(5, 'Vikram Gupta', 'Male', '1978-07-22', 2, 'Bachelor''s Degree'),
(6, 'Meena Verma', 'Female', '2012-04-05', 2, 'Elementary School'),
(7, 'Rahul Joshi', 'Male', '1990-03-17', 3, 'PhD'),
(8, 'Anjali Mehta', 'Female', '1992-06-28', 3, 'Master''s Degree'),
(9, 'Suresh Kumar', 'Male', '1965-12-10', 4, 'High School'),
(10, 'Lakshmi Devi', 'Female', '1968-01-20', 4, 'Middle School'),
(11, 'Vinod Yadav', 'Male', '1982-08-14', 5, 'Bachelor''s Degree'),
(12, 'Kavita Reddy', 'Female', '1984-10-05', 5, 'Master''s Degree'),
(13, 'Prakash Tiwari', 'Male', '2008-05-30', 5, 'Elementary School'),
(14, 'Neha Mishra', 'Female', '1995-09-12', 6, 'Bachelor''s Degree'),
(15, 'Ravi Verma', 'Male', '1993-04-25', 7, 'Master''s Degree'),
(16, 'Pooja Gandhi', 'Female', '1988-11-15', 8, 'Bachelor''s Degree'),
(17, 'Deepak Sharma', 'Male', '1970-07-08', 9, 'High School'),
(18, 'Anita Patel', 'Female', '1972-02-19', 9, 'Middle School'),
(19, 'Mohan Singh', 'Male', '2015-12-03', 9, 'Pre-school'),
(20, 'Savita Kumari', 'Female', '1990-10-10', 10, 'Bachelor''s Degree');

-- Insert users
INSERT INTO users (username, password, role, citizen_id) VALUES
('rajkumar', 'hashed_password1', 'citizen', 1),
('priyasingh', 'hashed_password2', 'citizen', 2),
('amitpatel', 'hashed_password3', 'citizen', 3),
('admin', 'admin_password', 'admin', NULL),
('employee1', 'emp_password1', 'employee', 7),
('employee2', 'emp_password2', 'employee', 11),
('monitor1', 'mon_password1', 'monitor', NULL),
('sunitasharma', 'hashed_password4', 'citizen', 4),
('vikramgupta', 'hashed_password5', 'citizen', 5),
('rahulj', 'hashed_password6', 'citizen', 7);

-- Insert land records
INSERT INTO land_records (land_id, citizen_id, area_acres, crop_type) VALUES
(1, 1, 2.50, 'Rice'),
(2, 4, 3.75, 'Wheat'),
(3, 5, 1.25, 'Vegetables'),
(4, 7, 5.00, 'Cotton'),
(5, 11, 2.00, 'Sugarcane'),
(6, 17, 3.50, 'Pulses'),
(7, 12, 4.25, 'Rice'),
(8, 16, 2.75, 'Wheat'),
(9, 8, 1.50, 'Vegetables'),
(10, 2, 6.00, 'Fruits');

-- Insert panchayat employees
INSERT INTO panchayat_employees (employee_id, citizen_id, role) VALUES
(1, 7, 'Secretary'),
(2, 11, 'Accountant'),
(3, 15, 'Health Worker'),
(4, 8, 'Agricultural Officer'),
(5, 14, 'Education Officer');

-- Insert assets
INSERT INTO assets (asset_id, type, location, installation_date) VALUES
(1, 'Water Pump', 'Main Square', '2018-05-15'),
(2, 'Solar Panel', 'Community Center', '2019-11-20'),
(3, 'Street Light', 'Oak Avenue', '2020-01-10'),
(4, 'Public Toilet', 'Market Area', '2019-07-05'),
(5, 'Community Hall', 'Village Center', '2015-12-22'),
(6, 'Primary Health Center', 'Near Temple', '2017-08-30'),
(7, 'Playground Equipment', 'School Ground', '2021-03-15'),
(8, 'Water Tank', 'Northern Area', '2016-09-12');

-- Insert welfare schemes
INSERT INTO welfare_schemes (scheme_id, name, description, status, expiry_date) VALUES
(1, 'Farmer Subsidy', 'Financial assistance for farmers', TRUE, '2025-12-31'),
(2, 'Education Scholarship', 'Scholarships for underprivileged students', TRUE, '2024-03-31'),
(3, 'Healthcare Initiative', 'Free medical checkups and medicines', TRUE, '2023-12-31'),
(4, 'Housing Scheme', 'Affordable housing for BPL families', TRUE, '2025-06-30'),
(5, 'Women Empowerment Program', 'Skill development for women', TRUE, '2024-09-30'),
(6, 'Old Age Pension', 'Monthly pension for senior citizens', TRUE, NULL),
(7, 'Digital Literacy', 'Computer education for rural youth', FALSE, '2022-12-31');

-- Insert scheme enrollments
INSERT INTO scheme_enrollments (enrollment_id, citizen_id, scheme_id, enrollment_date) VALUES
(1, 1, 1, '2022-01-15'),
(2, 2, 5, '2022-02-20'),
(3, 4, 1, '2022-01-25'),
(4, 5, 1, '2022-03-10'),
(5, 9, 6, '2022-04-05'),
(6, 10, 6, '2022-04-05'),
(7, 3, 2, '2022-02-12'),
(8, 6, 2, '2022-02-15'),
(9, 13, 2, '2022-02-18'),
(10, 19, 2, '2022-02-22'),
(11, 17, 3, '2022-05-01'),
(12, 18, 3, '2022-05-01');

-- Insert vaccinations
INSERT INTO vaccinations (vaccination_id, citizen_id, vaccine_type, date_administered) VALUES
(1, 1, 'COVID-19', '2021-06-10'),
(2, 2, 'COVID-19', '2021-06-12'),
(3, 4, 'COVID-19', '2021-06-15'),
(4, 5, 'COVID-19', '2021-06-18'),
(5, 7, 'COVID-19', '2021-07-01'),
(6, 8, 'COVID-19', '2021-07-03'),
(7, 3, 'Polio', '2015-03-12'),
(8, 6, 'Polio', '2017-04-15'),
(9, 13, 'Polio', '2013-05-20'),
(10, 19, 'Polio', '2020-03-25'),
(11, 11, 'COVID-19', '2021-07-10'),
(12, 12, 'COVID-19', '2021-07-12'),
(13, 14, 'COVID-19', '2021-07-15'),
(14, 15, 'COVID-19', '2021-07-20'),
(15, 16, 'COVID-19', '2021-08-01');

-- Insert census data
INSERT INTO census_data (household_id, citizen_id, event_type, event_date) VALUES
(1, 1, 'Birth', '1980-05-12'),
(1, 2, 'Birth', '1982-09-23'),
(1, 3, 'Birth', '2010-02-15'),
(2, 4, 'Birth', '1975-11-30'),
(2, 5, 'Birth', '1978-07-22'),
(2, 6, 'Birth', '2012-04-05'),
(3, 7, 'Birth', '1990-03-17'),
(3, 8, 'Birth', '1992-06-28'),
(1, 1, 'Marriage', '2008-11-12'),
(1, 2, 'Marriage', '2008-11-12'),
(2, 4, 'Marriage', '2000-06-15'),
(2, 5, 'Marriage', '2000-06-15'),
(9, 17, 'Death', '2022-01-05'),
(5, 13, 'Education Update', '2022-03-10');

-- Insert scheme applications
INSERT INTO scheme_applications (citizen_id, scheme_id) VALUES
(1, 1),
(2, 5),
(3, 2),
(4, 1),
(5, 1),
(6, 2),
(7, 4),
(8, 3),
(9, 6),
(10, 6),
(11, 4),
(12, 5);