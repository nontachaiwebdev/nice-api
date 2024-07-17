const CREATE_USER = (user, encodedPassword) => `INSERT INTO nice.users
(firstname, lastname, email, password, group_one, group_two, created_at)
VALUES("${user.firstname}", "${user.lastname}", "${user.email}", "${encodedPassword}", 1, 0, NOW());`

const GET_USER_BY_EMAIL = `SELECT id, firstname, lastname, password, email, group_one, group_two, created_at
FROM nice.users WHERE email = ":email"`

const CREATE_FILE = (group, name, user_id) => `INSERT INTO nice.files
(group_name, file_name, created_at, created_by)
VALUES("${group}", "${name}", now(), ${user_id})`

const GET_FILES = `SELECT f.*, u.firstname, u.lastname
FROM nice.files as f JOIN nice.users as u
ON u.id = f.created_by`

module.exports = {
    CREATE_USER,
    GET_USER_BY_EMAIL,
    CREATE_FILE,
    GET_FILES
}