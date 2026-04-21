/**
 * Database lab — queries.js
 * ---------------------
 * Standalone script: connect to the same DB, run example aggregate SELECTs.
 * Run after you have submitted at least one CV via the web form:
 *   node queries.js
 *   npm run queries
 */

const { connectDb, getPool } = require('./db');

async function runQueries() {
  await connectDb();
  const pool = getPool();

  // —— QUERY 1: COUNT — how many courses per person (LEFT JOIN keeps people with 0 courses)
  console.log('\n── QUERY 1: Number of courses per person ──');

  const [courseCounts] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(c.idcourse) AS courseCount
    FROM person p
    LEFT JOIN course c ON c.person_idperson = p.idperson
    GROUP BY p.idperson
    ORDER BY courseCount DESC
  `);

  courseCounts.forEach(row =>
    console.log(`  ${row.fName} ${row.lName} → ${row.courseCount} course(s)`)
  );

  // —— QUERY 2: only persons with more than 1 project
  console.log('\n── QUERY 2: Persons with more than 1 project ──');

  const [topPerson] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(pr.idproject) AS projectCount
    FROM person p
    INNER JOIN project pr ON pr.person_idperson = p.idperson
    GROUP BY p.idperson
    HAVING projectCount > 1
    ORDER BY projectCount DESC
  `);

  if (topPerson.length > 0) {
    topPerson.forEach(t =>
      console.log(`  ${t.fName} ${t.lName} — ${t.projectCount} project(s)`)
    );
  } else {
    console.log('  No data yet.');
  }

  // —— QUERY 3: DISTINCT — list unique countries in person table
  console.log('\n── QUERY 3: Unique countries ──');

  const [distinctCountries] = await pool.query(`
    SELECT DISTINCT country
    FROM person
    ORDER BY country ASC
  `);

  distinctCountries.forEach(row =>
    console.log(`  ${row.country || 'N/A'}`)
  );

  // —— QUERY 4: DELETE — remove persons with no city set
  // console.log('\n── QUERY 4: Delete persons with no city ──');

  // const [deleteResult] = await pool.query(`
  //   DELETE FROM person
  //   WHERE city IS NULL OR city = ''
  // `);

  // console.log(`  Deleted ${deleteResult.affectedRows} person(s) with no city.`);

  // —— QUERY 5: UPDATE — update email for person with id = 1
  console.log('\n── QUERY 5: Update email for person with id = 1 ──');

  const [updateResult] = await pool.query(`
  UPDATE person p SET p.email = 'test@updated.com' where p.idperson = 1 ;
`);
  console.log(`  Updated ${updateResult.affectedRows} person(s) email(s).`);


  // ======================================== TASK =============================================================
  // 1- Show persons who are enrolled in more than 2 courses, display their full name and course count
  console.log('\n── QUERY 2: Persons with more than 2 courses ──');

  const [topPerson2] = await pool.query(`
    SELECT p.fName, p.lName, COUNT(cr.idcourse) AS courseCount
    FROM person p
    INNER JOIN course cr ON cr.person_idperson = p.idperson
    GROUP BY p.idperson
    HAVING courseCount > 2
    ORDER BY courseCount DESC
  `);
  if (topPerson2.length > 0) {
    topPerson2.forEach(t =>
      console.log(`  ${t.fName} ${t.lName} — ${t.courseCount} course(s)`)
    );
  } else {
    console.log('  No data yet.');
  }


  // 2- list each distinct country and the number of persons in it, only show countries with more than 2 persons
  console.log('\n── QUERY 3: Countries with more than 2 persons ──');

  const [countriesWithPersons] = await pool.query(`
    SELECT p.country, COUNT(p.idperson) AS personCount
    FROM person p
    GROUP BY p.country
    HAVING personCount > 2
    ORDER BY personCount DESC
  `);
  if (countriesWithPersons.length > 0) {
    countriesWithPersons.forEach(t =>
      console.log(`  ${t.country} — ${t.personCount} person(s)`)
    );
  } else {
    console.log('  No data yet.');
  }

  // 3- Update the email of all persons who have at least one project, set it to their firstName + lastName + '@company.com
  console.log('\n── QUERY 4: Update email for persons with at least one project ──');
  const [updateEmailResult] = await pool.query(`
    UPDATE person p
    SET p.email = CONCAT(p.fName, p.lName, '@company.com')
    WHERE EXISTS (
      SELECT 1
      FROM project pr
      WHERE pr.person_idperson = p.idperson
    )
  `);
  console.log(`  Updated ${updateEmailResult.affectedRows} person(s) email(s).`);


  // 4- Delete all courses that belong to persons from a specific country
  console.log('\n── QUERY 5: Delete courses for persons from a specific country ──');
  const specificCountry = 'USA'; // change this to the desired country
  const [deleteCoursesResult] = await pool.query(`
    DELETE c
    FROM course c
    INNER JOIN person p ON c.person_idperson = p.idperson
    WHERE p.country = ?
  `, [specificCountry]);
  console.log(`  Deleted ${deleteCoursesResult.affectedRows} course(s) for persons from ${specificCountry}.`);


  // 5- Show each country and the average number of languages spoken by persons from that country, only show countries where the average is more than 1
  console.log('\n── QUERY 6: Average number of languages spoken by country ──');
  const [avgLanguagesByCountry] = await pool.query(`
    SELECT p.country, AVG(langCount) AS avgLanguages
    FROM person p
    INNER JOIN (
      SELECT person_idperson, COUNT(idlanguage) AS langCount
      FROM language
      GROUP BY person_idperson
    ) lang ON lang.person_idperson = p.idperson
    GROUP BY p.country
    HAVING avgLanguages > 1
    ORDER BY avgLanguages DESC
  `);
  if (avgLanguagesByCountry.length > 0) {
    avgLanguagesByCountry.forEach(t =>
      console.log(`  ${t.country} — ${t.avgLanguages.toFixed(2)} language(s)`)
    );
  } else {
    console.log('  No data yet.');
  }

  await pool.end();
}

runQueries().catch(err => console.error('Error:', err.message));