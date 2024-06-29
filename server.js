const express = require('express');
const cron = require('node-cron');
const app = express();
app.use(express.json());
const port=3000;

let departments = [
    { id: 1, name: 'Science', downloads: 100, lastWeekWinner: false },
    { id: 2, name: 'Arts', downloads: 80, lastWeekWinner: false },
    { id: 3, name: 'Engineering', downloads: 150, lastWeekWinner: true },
    { id: 4, name: 'Mathematics', downloads: 60, lastWeekWinner: false },
    { id: 5, name: 'Literature', downloads: 90, lastWeekWinner: false },
  ];

  let books = [
    { isbn: 9781234567890, title: 'Physics Fundamentals', downloads: 50, lastDownloaded: new Date('2024-06-27T10:00:00'), departmentId: 1, weeklyDownloads: [] },
    { isbn: 9781234567891, title: 'Chemistry 101', downloads: 30, lastDownloaded: new Date('2024-06-26T11:00:00'), departmentId: 1, weeklyDownloads: [] },
    { isbn: 9781234567892, title: 'Introduction to Painting', downloads: 20, lastDownloaded: new Date('2024-06-28T12:00:00'), departmentId: 2, weeklyDownloads: [] },
    { isbn: 9781234567893, title: 'Mechanical Engineering Basics', downloads: 70, lastDownloaded: new Date('2024-06-25T13:00:00'), departmentId: 3, weeklyDownloads: [] },
    { isbn: 9781234567894, title: 'Advanced Calculus', downloads: 40, lastDownloaded: new Date('2024-06-24T14:00:00'), departmentId: 4, weeklyDownloads: [] },
    { isbn: 9781234567895, title: 'Classic Literature', downloads: 60, lastDownloaded: new Date('2024-06-23T15:00:00'), departmentId: 5, weeklyDownloads: [] }
 ];

  //getting top 5 departments
  app.get('/popular-departments', (req, res) => {
    const sortedDepartments = [...departments].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
    const lastWeekWinner = departments.find(dep => dep.lastWeekWinner);
    res.json({ lastWeekWinner, topDepartments: sortedDepartments });
  });


  //filtering popular books based on period
  app.get('/popular-books', async (req, res) => {
    try {
      const { period } = req.query;
      let dateFilter;  
      if (period === 'weekly') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (period === 'monthly') {
        dateFilter = new Date();
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else if (period === 'daily') {
        dateFilter = new Date();
        dateFilter.setHours(dateFilter.getHours() - 1);
      } else {
        return res.status(400).send('Invalid period');
      }  
      const result = await books
                            .filter(p=>p.lastDownloaded >= dateFilter)
                            .sort((a,b)=>b.downloads-a.downloads);
      res.json({ result });
    } catch (error) {
      res.status(500).send(error);
    }
  });


  //Updating download count in books and which department book belongs
  app.post('/download', async (req, res) => {
    try {
        const { ISBN} = req.body;
        console.log(ISBN);
        const book = books.find(bk => bk.isbn === ISBN);
        console.log(book);
        if (book) {
            book.downloads += 1;
            book.lastDownloaded = new Date();
            const dptm = departments.find(dpt=>dpt.id==book.departmentId);
            console.log(dptm);
            dptm.downloads+=1;
            var p1={};
            p1.message='Download count updated';
            p1.book= book;
            p1.department = dptm;
            res.status(200).send(p1);

        } else {
            res.status(404).send('Book not found');
        }
        //console.log("Updated book.....")
        //console.log(books.find(bk => bk.isbn === ISBN));
    } catch (error) {
      res.status(500).send(error);
    }
  });

  function updateWeeklyDownloads() {
    books.forEach(book => {
      // Add current week's download count to the weeklyDownloads array
      book.weeklyDownloads.push(book.downloads);
  
      // Keep only the last two weeks' data
      if (book.weeklyDownloads.length > 2) {
        book.weeklyDownloads.shift();
      }
    });
  
    // Identify and remove books that have been least downloaded for two consecutive weeks
    books = books.filter(book => {
      if (book.weeklyDownloads.length < 2) return true;
      const [week1, week2] = book.weeklyDownloads;
      return week1 !== week2 || (week1 !== Math.min(...book.weeklyDownloads) || week2 !== Math.min(...book.weeklyDownloads));
    });
  }

  //scheduler to remove the books which has lesser download in last 2 weeks
  //schedule tasks to update weekly downloads every Sunday at midnigh
  cron.schedule('0 0 * * 0',()=>{
    console.log('Updating weekly downloads...');
    updateWeeklyDownloads();
    console.log('Weekly downloads updated and least downloaded books removed.');
  });


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
