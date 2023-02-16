//All of the setup
const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer');
require('dotenv').config();

const PORT = process.env.PORT;
const app = express();

//Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Connecting to database using environment variables
const db = mysql.createConnection(
  {
    host: 'localhost',
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DATABASE
  },
  console.log(`Connected to the company database.`)
);

//all of the db methods following will reference the ask questions so that the query completes than asks more questions
//previous versions had the problem where the database call and the inquirer prompts disrupted each other


//START OF VIEWS

//All the views SELECT * from their respective tables and then call for the user what to do next

viewDepartments = () => {
  db.query(`SELECT * FROM department`, function (err, results) {
    if(err){
      throw err;
    }
    console.table(results);
    
    askQuestions();
  });
}

viewRoles = () => {
  db.query("SELECT role.id, role.title, department.name AS department, role.salary FROM role INNER JOIN department ON department.id=role.department_id", function (err, results) {
    if(err){
      throw err;
    }
    console.table(results);
    
    askQuestions();
  });
}

viewEmployees = () => {
  db.query("SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(m.first_name,' ', m.last_name) AS manager FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee m ON employee.manager_id = m.id", function (err, results) {
    if(err){
      throw err;
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
  db.query(`INSERT INTO department (name) VALUES ('${departmentObject.name}')`, function (err, results){
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

      db.query(`INSERT INTO role (title, salary, department_id) VALUES ('${roleObject.name}', ${roleObject.salary}, ${roleObject.department})`, function (err, results){
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
  let roles =[];
  let managers =[];
  let roleIDs = [];
  let managerIDs = [];

  //I don't like this being as nested as this is but I can't think of anything else
  db.query(`SELECT id, title FROM role`, function(err, roleResults) {
    //store the roles
    for(let result of roleResults){
      roles.push(result.title);
      roleIDs.push(result.id)
    }

    //second nest
    //gets the users desired role
    inquirer.prompt([
      {
        type: 'list',
        message: 'What is this employee\'s role?',
        name: 'role',
        choices: roles
      }
    ]).then((roleResponse) => {

      for(let i = 0; i < roles.length; i++){
        if(roles[i] === roleResponse.role){
          employeeObject.role = roleIDs[i];
        }
      }

      //third nest
      //gets the employees to choose the manager
      db.query(`SELECT id, first_name AS firstName, last_name AS lastName FROM employee`, function(err, employeeResults){

        for(let result of employeeResults){
          managers.push(`${result.firstName} ${result.lastName}`);
          managerIDs.push(result.id);
        }

        //fourth nest
        inquirer.prompt([
          {
            type: 'list',
            message: 'Who is this employee\'s manager',
            name: 'manager',
            choices: [...managers, 'none']
          }
        ]).then((managerResponse) => {

          employeeObject.manager = managerResponse.manager;

          if(employeeObject.manager === 'none'){
            employeeObject.manager = 'NULL';
          }else{
            for(let j = 0; j < managers.length; j++){
              if(managers[j] === managerResponse.manager){
                employeeObject.manager = managerIDs[j];
              }
            }
          }

          //fifth nest
          //queries the database to store our new employees
          db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${employeeObject.firstName}', '${employeeObject.lastName}', ${employeeObject.role}, ${employeeObject.manager})`, function(err, results){
            if(err){
              throw err;
            }
            
            console.log(`Added ${employeeObject.firstName} ${employeeObject.lastName} to the database`);

            askQuestions();
          });
          //end of fifth nest

        });
        //end of fourth nest
      });
      //end of third nest
    });
    //end of second nest

  });
}

//END OF ADD METHODS

//THE ONE UPDATE METHOD

updateEmployee = () => {
  let employees = [];
  let roles = [];
  let roleIDs = [];
  db.query(`SELECT first_name AS first, last_name AS last FROM employee`, function(err, employeeResults){

    for(let result of employeeResults){
      employees.push(`${result.first} ${result.last}`);
    }

    //second nest
    inquirer.prompt([
      {
        type: 'list',
        message: 'Which employee\'s role do you want to update?',
        name: 'employee',
        choices: employees
      }
    ]).then(employeeResponse => {

      let employeeID = 0;
      for(let i = 0; i < employees.length; i++){
        if(employeeResponse.employee === employees[i]){
          employeeID = i + 1;
        }
      }

      //third nest
      db.query(`SELECT id, title FROM role`, (err, roleResults) => {

        for(let result of roleResults){
          roles.push(result.title);
          roleIDs.push(result.id);
        }

        //fourth nest
        inquirer.prompt([
          {
            type: 'list',
            message: 'Which role do you want to assign the selected employee',
            name: 'role',
            choices: roles
          }
        ]).then(response => {

          let roleID = 0;
          for(let j = 0; j < roles.length; j++){
            if(roles[j] === response.role){
              roleID = roleIDs[j];
            }
          }

          //fifth nest
          db.query(`UPDATE employee SET role_id = ${roleID} WHERE id = ${employeeID}`, (err, results) => {
            if(err){
              throw err;
            }

            console.log(`Updated ${employeeResponse.employee}'s role`);

            askQuestions();

          });
          //end of fifth nest

        });
        //end of fourth nest

      });
      //end of third nest

    });
    //end of second nest

  });
}


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
    when: answers => answers.query === 'Add a Role'
  },
  {
    type: 'input',
    message: 'What is the employee\'s first name?',
    name: 'firstName',
    when: answers => answers.query === 'Add an Employee'
  },
  {
    type: 'input',
    message: 'What is the employee\'s last name?',
    name: 'lastName',
    when: answers => answers.query === 'Add an Employee'
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
          break;
        case 'View all Employees':
          await viewEmployees();
          break;
        case 'Add an Employee':
          addEmployee(response);
          break;
        case 'Update an Employee\'s Role':
          updateEmployee();
          break;
      }

    }else{

      server.closeAllConnections();
      server.close();
      
    }
  });
}

//initialization
askQuestions();