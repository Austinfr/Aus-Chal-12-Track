const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer');
const { response } = require('express');
require('dotenv').config();

const PORT = process.env.PORT;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: process.env.USER,
    // MySQL password
    password: process.env.PASS,
    database: process.env.DATABASE
  },
  console.log(`Connected to the company database.`)
);

app.use((req, res) => {
  res.status(404).end();
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
})

//todo update views
viewDepartments = async () => {
  db.query('SELET * FROM department', function (err, results) {
    console.log(results);
  });
}

viewRoles = async () => {
  db.query('SELET * FROM role', function (err, results) {
    console.log(results);
  });
}

viewEmployees = async () => {
  db.query('SELET * FROM employee', function (err, results) {
    console.log(results);
  });
}

//todo update adds
//example departmentobject = {
//  name: 'exapmle'
//}
addDepartment = async (departmentObject) => {
  db.query(`INSERT INTO department (name) VALUES (${departmentObject.name})`, function (err, results){
    if(err){
      throw err;
    }
  });
}

//example roleObject = {
//  name: 'example',
//  salary: '1234',
//  department: 'upper'
//}
addRole = async (roleObject) => {
  db.query(`INSERT INTO role (name, salary, department) VALUES (${roleObject.name}, ${roleObject.salary}, ${roleObject.department})`, function (err, results){
    if(err){
      throw err;
    }
  });
}

//example employeeObject = {
//  firstName: 'Sara',
//  lastName: 'Lynne',
//  role: 'vocation',
//  manager: 'Bojack'
//}
addEmployee = async (employeeObject) => {

}

//todo update it, empty for now
function getDepartmentsNames(){
  db.query('SELECT name FROM department', function (err, results){
    return results;
  });
}

function getRolesNames(){
  db.query('SELECT name FROM role', function (err, results){
    return results;
  });
}

function getEmployeesNames(){
  return ['none'];
}

//inquirer options:
//view all for each table
//add for each table
//update for employee
//quit
function askQuestions() {
  inquirer.prompt([
  {
    type: 'list',
    message: 'What would you like to do?',
    name: 'query',
    choices: ['View Departments', 'Add a Department', 'View Roles', 'Add a Role','View all Employees','Add an Employee','Update an Employee\'s Role','Quit']
  },
  {
    type: 'input',
    //how I have it is that splitting 'Add a Department' by a ' ' and getting the third element will return the thing I'm adding
    message: (answers) => `What is the name of the ${answers.query.split(' ')[2].toLowerCase()} you'd like to add`,
    name: 'name',
    //only when it's not an employee
    when: (answers) => answers.query.includes('Add') && !answers.query.includes('Employee')
  },
  {
    type: 'input',
    message: 'What is the role\'s salary?',
    name: 'salary',
    when: (answers) => answers.query === 'Add a Role'
  },
  {
    type: 'list',
    message: 'Which department does the role belong to?',
    name: 'deparment',
    choices: getDepartmentsNames(),
    when: (answers) => answers.query === 'Add a Role'
  },
  {
    type: 'input',
    message: 'What is the employee\'s first name?',
    name: 'firstName',
    when: (answers) => answers.query === 'Add an Employee'
  },
  {
    type: 'input',
    message: 'What is the employee\'s last name?',
    name: 'lastName',
    when: (answers) => answers.query === 'Add an Employee'
  },
  {
    type: 'list',
    message: 'What is the employee\'s role?',
    name: 'role',
    choices: getRolesNames(),
    when: (answers) => answers.query === 'Add an Employee'
  },
  {
    type: 'list',
    message: 'Who is the employee\'s manager?',
    name: 'manager',
    choices: getEmployeesNames(),
    when: (answers) => answers.query === 'Add an Employee'
  },
  {
    type: 'list',
    //how very proper
    message: 'For which employee would you like to update their role?',
    name: 'employee',
    choices: getEmployeesNames(),
    when: (answers) => answers.query.includes('Update')
  },
  {
    type: 'list',
    message: 'Which role would you like to assign to this employee?',
    name: 'role',
    when: (answers) => answers.query.includes('Update')
  }
  ]).then((response) => {
    if(response.query !== 'Quit'){
      switch(response.query){
        case 'View Departments':
          viewDepartments();
          break;
        case 'Add a Department':
          addDepartment(response);
          console.log(`Added ${response.name} to the database`);
          break;
        case 'View Roles':
          viewRoles();
          break;
        case 'Add a Role':
          addRole(response);
          console.log(`Added ${response.name} to the database`);
          break;
        case 'View all Employees':
          viewEmployees();
          break;
        case 'Add an Employee':
          addEmployee(response);
          console.log(`Added ${response.firstName} ${response.lastName} to the database`);
          break;
        case 'Update an Employee':
          updateEmployee(response);
          console.log(`Updated employee's role`)
          break;
      }
      askQuestions();
    }
  });
}