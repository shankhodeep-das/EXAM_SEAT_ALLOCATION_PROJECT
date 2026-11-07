const getStudents = (req, res) => {

    const students = [
        {
            id: 1,
            name: "Rahul",
            course: "BCA"
        },
        {
            id: 2,
            name: "Amit",
            course: "BTech"
        },
        {
            id: 3,
            name: "Priya",
            course: "BCA"
        }
    ];

    res.status(200).json({
        success: true,
        students: students
    });

};

module.exports = { getStudents };