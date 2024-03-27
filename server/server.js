const sql = require("mssql");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { exec } = require('child_process');
const { log } = require("console");
const app = express();
app.use(cors());
app.use(express.json());

const config = {
  user: "phuwanon",
  password: "0881509604",
  server: "localhost",
  database: "RepairDB",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};
let pool;
sql
  .connect(config)
  .then((p) => {
    pool = p;
    console.log("Connected to SQL Server");
  })
  .catch((err) => {
    console.error("Error connecting to SQL Server:", err);
  });

app.post("/incident", (req, res) => {
  const sqlQuery = "SELECT * FROM dbusers WHERE id = 1";
  const request = pool.request();
  request.query(sqlQuery, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการ query", err);
      res.status(500).json({ error: "ไม่สามารถ query ข้อมูลได้" });
    } else {
      res.json(result.recordset);
    }
  });
});

app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

app.post("/adddata", (req, res) => {
  const data = req.body;
  const Case = req.body.Case;

  if (Case === 1) {
    const sqlQuery =
      "INSERT INTO dbreport (Problem,Iamge,Status,Type,ipaddress,userid,Date,Phoneuser,Fname) VALUES(@problem,@iamge,1,@type,@ip,@userid,@date,@phoneuser,@name)";
    if (!pool) {
      return res.status(500).json({ err: "ไม่สามารถติดต่อฐานข้อมูลได้" });
    }

    const requestadd = pool.request();
    requestadd.input("problem", sql.NVarChar, data.problem);
    requestadd.input("name", sql.NVarChar, data.Fname);
    requestadd.input("iamge", sql.NVarChar, data.image);
    requestadd.input("type", sql.NVarChar, data.Type);
    requestadd.input("ip", sql.NVarChar, data.IP);
    requestadd.input("userid", sql.Int, data.userid);
    requestadd.input("date", sql.NVarChar, data.Date);
    requestadd.input("phoneuser", sql.Int, data.Phone);
    requestadd.query(sqlQuery, (err, result) => {
      if (err) {
        console.error("เกิดปัญหาในการส่งข้อมูล", err);
        return res.status(500).json({ err: "เกิดปัญหาในการ qurry" });
      } else {
        res.json(result.recordset);
      }
    });
  }
});
app.post("/history", (req, res) => {
  const data = req.body;
  console.log(data);
  const requesthis = pool.request();
  const sqlhistory = "SELECT * FROM dbreport WHERE userid = @id";
  requesthis.input("id", sql.Int, data.employeeID);

  requesthis.query(sqlhistory, (err, result) => {
    if (err) {
      res.status(500).json({ err: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    } else {
      res.json(result.recordset);
    }
  });
});
app.post("/countdatacase", (req, res) => {
  const count =
    "SELECT *, (SELECT COUNT(*) FROM dbreport WHERE Status = 1) AS StatusCount FROM dbreport;"
  const request = pool.request();
  request.query(count, (err, result) => {
    if (err) {
      res.status(500).json(err, "เกิดข้อผิดพลาดในการทำงาน");
    } else {
      res.json(result.recordset);
    }
  });
});
app.post("/information", (req, res) => {
  const data = req.body;
  console.log(data);

  const sqlinfor =
  "BEGIN \
    INSERT INTO dbinformation (information, Datecase, Typecase, Ucasename, IDusercase) \
    VALUES (@infor, @dateinfor, @typeinfor, @Ucasename, @iduserinfor); \
    UPDATE dbreport SET Status = 2 WHERE id = @id; \
  END;";

const requestinfor = pool.request();
requestinfor.input("infor", sql.NVarChar, data.detile);
requestinfor.input("dateinfor", sql.NVarChar, data.Time);
requestinfor.input("typeinfor", sql.NVarChar, data.utype);
requestinfor.input("Ucasename", sql.NVarChar, data.uname);
requestinfor.input("iduserinfor", sql.Int, data.userid);
requestinfor.input("id", sql.Int, data.id);
  requestinfor.query(sqlinfor, (err, result) => {
    if (err) {
      res.status(500).json({ error: "เกิดข้อผิดพลาดในการทำงาน" });
    } else {
      res.json(result.recordset);
    }
  });
});
app.post("/loaddatacase", (req, res) => {
  const sqlcase = "SELECT * FROM dbreport WHERE Status = 1";
  const request = pool.request();
  request.query(sqlcase, (err, result) => {
    if (err) {
      res.status(500).json(err, "เกิดข้อผิดพลาด");
    } else {
      res.json(result.recordset);
    }
  });
});
app.post("/loaddatasuccess",(req,res)=>{
  const sqlsuccess ="SELECT * FROM dbinformation"
  const request = pool.request();
  request.query(sqlsuccess,(err,result)=>{
    if(err){
      res.status(500).json(err,"เกิดข้อผิดพลาด");
      
    }else{
      res.json(result.recordset);
    }
  })
})
app.post("/ipv4", (req, res) => {
  exec('powershell.exe -File "E:\\projectphuwanon\\Repair notification system\\client\\scripts\\getIPv4.ps1"', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing PowerShell script: ${error}`);
        res.status(500).json({ error: "Error executing PowerShell script" });
        return;
    }

    const ipv4 = stdout.trim();
    console.log(`IPv4 Address from PowerShell: ${ipv4}`);

    res.json({ ipv4 });
});
});
app.post("/openRMD",(req,res)=>{
  const ipv4 = req.body
  console.log(ipv4);
  const ipAddress = Object.keys(ipv4)[0];
  console.log(ipAddress);
  exec(`powershell.exe -File "E:\\projectphuwanon\\Repair notification system\\client\\scripts\\openRDP.ps1" -ipv4Address ${ipAddress}`, (rdpError, rdpStdout, rdpStderr) => {
    if (rdpError) {
      console.error(`Error opening RDP: ${rdpError}`);
      res.status(500).json({ error: "Error opening RDP" });
      return;
    }
  
    console.log(`RDP opened successfully`);
    res.json({ message: "RDP opened successfully" });
  });
})


const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
