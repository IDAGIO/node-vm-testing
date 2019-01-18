import express from 'express';
const app = express();

app.get('/a', (req, res, next) => {
  res.sendFile('dist/a.html');
});

app.listen(process.env.PORT, () => {
  console.log(`Server: listening on port ${process.env.PORT}`);
});
