const pg = require("pg");
const conn = new pg.Client({ database: "test" });

(async () => {
  await conn.connect();
  const res = await conn.query(
    "select p.id, p.title, sp.title as subPage, pp.breadcrumbs from posts as p " +
      "left join sub_pages as sp on p.id = sp.post_id " +
      "left join breadcrumbs as pp on p.id = pp.post_id where p.id = 2;"
  );
  console.log(res.rows[0]);
  conn.end();
})();
