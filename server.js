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

//all of the db methods following will reference the ask questions so that the query completes than asks more questions
//previous versions had the problem where the database call and the inquirer prompts disrupted each other


//START OF VIEWS

//todo update views
viewDepartments = async () => {
  db.query(`SELECT * FROM department`, function (err, results) {
    if(err){
      console.log(err);
    }
    console.table(results);
    
    askQuestions();
  });
}

viewRoles = () => {
  db.query("SELECT * FROM role", function (err, results) {
    if(err){
      console.log(err);
    }
    console.table(results);
    
    askQuestions();
  });
}

viewEmployees = () => {
  db.query("SELECT * FROM employee", function (err, results) {
    if(err){
      console.log(err);
    }
    console.table(results);
    
    askQuestions();
  });
}

//END OF VIEWS

//START OF ADD METHODS

//For all the adds they need a inquirer prompt within the method cause of how it works, I can't figure out a better way right now
//
//example departmentobject = {
//  name: 'exapmle'
//}
addDepartment = (departmentObject) => {
  db.query(`INSERT INTO department (name) VALUES (${departmentObject.name})`, function (err, results){
    if(err){
      throw err;
    }

    console.log(`Added ${departmentObject.name} to the database`);

    askQuestions();
  });
}

//example roleObject = {
//  name: 'example',
//  salary: '1234',
//  department: 'upper'
//}
addRole = (roleObject) => {
  //nested query so I can get the name and id
  db.query(`SELECT id, name FROM department`, function(err, results){
    let choices = [];
    let ids = [];
    for(let result of results){
      choices.push(result.name);
      ids.push(result.id);
    }

    inquirer.prompt([
      {
        type: 'list',
        message: 'Which department does this role belong to?',
        name: 'department',
        choices: choices
      }
    ]).then((response) => {
      //there has got to be an easier way to do this but i'm very behind :(
      for(let i = 0; i < choices.length; i++){
        if(choices[i] === response.department){
          roleObject.department = ids[i];
        }
      }
      db.query(`INSERT INTO role (title, salary, department) VALUES (${roleObject.name}, ${roleObject.salary}, ${roleObject.department})`, function (err, results){
        if(err){
          throw err;
        }
        console.log(`Added ${roleObject.name} to the database`);
        askQuestions();
      });
    });

  });
}

//example employeeObject = {
//  firstName: 'Sara',
//  lastName: 'Lynne',
//  role: 'vocation',
//  manager: 'Bojack'
//}
addEmployee = (employeeObject) => {
  if(employeeObject.manager === 'none'){
    employeeObject.manager = 'NULL';
  }
  db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ()`, function(err, results){
    if(err){
      throw err;
    }
  });
}

//END OF ADD METHODS

//START OF GETS


getDepartmentsNames = () => {
  db.query(`SELECT name FROM department`, function (err, results){
    if(err){
      return err;
    }
    console.log(results);
    return results;
  });
}

function getRolesNames(){
  db.query('SELECT title FROM role', function (err, results){
    return results;
  });
}

function getEmployeesNames(){
  db.query('SELECT first_name, last_name FROM employee', function (err, results){
    return ['none'].push(results);
  });
}

//END OF GET METHODS

app.use((req, res) => {
  res.status(404).end();
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
})

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
    message: 'Which role would you like to assign to this employee?',
    name: 'role',
    when: (answers) => answers.query.includes('Update')
  }
  ]).then(async (response) => {
    if(response.query !== 'Quit'){
      switch(response.query){
        case 'View Departments':
          await viewDepartments();
          break;
        case 'Add a Department':
          await addDepartment(response);
          break;
        case 'View Roles':
          await viewRoles();
          break;
        case 'Add a Role':
          addRole(response);
          console.log(`Added ${response.name} to the database`);
          break;
        case 'View all Employees':
          await viewEmployees();
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
    }else{
      server.close();
    }
  });
}


// //tests
// viewDepartments();
// viewRoles();
// viewEmployees();

console.log(getDepartmentsNames());