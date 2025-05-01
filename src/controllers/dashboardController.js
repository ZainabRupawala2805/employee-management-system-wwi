const { StatusCodes } = require("http-status-codes");
const dashboardService = require("../services/dashboardService");
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const { buffer } = require('stream/consumers');


const combineData = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = await dashboardService.combineData(userId);
        res.status(StatusCodes.OK).json({
            status: "success",
            message: "Dashboard data fetched successfully",
            data: data
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }

}

const monthlyCalendar = async (req, res) => {
    try {
        const { userId } = req.params;
        const response = await dashboardService.generateMonthlyCal(userId);
        res.status(StatusCodes.OK).json({
            status: "success",
            message: "Calendar data fetched successfully",
            data: response
        });
    } catch (error) {
        res.status(StatusCodes.OK).json({
            status: "fail",
            message: error.message,
        });
    }
};


const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../fonts/static/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../fonts/static/Roboto-Bold.ttf'),
        italics: path.join(__dirname, '../fonts/static/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../fonts/static/Roboto-BoldItalic.ttf'),
    },
};
// console.log("Font path test:", fs.existsSync(path.join(__dirname, '../fonts/static/Roboto-Regular.ttf')));

const printer = new PdfPrinter(fonts);

const generateUserPdf = async (req, res) => {
    try {
        const users = req.body;
        console.log("users: ", users);

        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: "No users provided." });
        }

        const tableHeaders = [
            "Name", "Email", "Contact", "Status",
            "Date of Joining", "Paid Leave", "Sick Leave", "Unpaid Leave", "Available Leave"
        ];

        const tableBody = [
            tableHeaders,
            ...users.map(user => [
                user.name,
                user.email,
                user.contact,
                user.status || "N/A",
                new Date(user.dateOfJoining?.['$date']).toDateString(),
                user.paidLeave ?? "-",
                user.sickLeave ?? "-",
                user.unpaidLeave ?? "-",
                user.availableLeaves ?? "-"
            ])
        ];

        const docDefinition = {
            content: [
                { text: 'User Table', style: 'header' },
                {
                    table: {
                        headerRows: 1,
                        widths: Array(tableHeaders.length).fill('auto'),
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: () => 0.5,
                        vLineWidth: () => 0.5,
                        fillColor: (i) => i === 0 ? '#eeeeee' : null,
                        paddingLeft: () => 2,
                        paddingRight: () => 2,
                        paddingTop: () => 2,
                        paddingBottom: () => 2
                    }
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 10]
                }
            },
            defaultStyle: {
                fontSize: 7,
                font: 'Roboto'
            }
        };

        // // Create PDF in memory
        // const pdfDoc = printer.createPdfKitDocument(docDefinition);
        // pdfDoc.end(); // finalize the PDF document

        // Define the file path
        const filePath = path.join(__dirname, '../public/uploads/user-table.pdf');

        // Create PDF and pipe it to a write stream
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(filePath));
        pdfDoc.end(); // finalize PDF generation

        // Read the PDF document as a buffer
        const pdfBuffer = await buffer(pdfDoc);

        // Send PDF back as binary (for blob)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="user-table.pdf"');
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating PDF" });
    }
};


// Old method code..
// const generateMeasurementPdf = async (req, res) => {
//     const { measurementKeys, customerId } = req.body;

//     if (
//         !measurementKeys ||
//         !Array.isArray(measurementKeys) ||
//         measurementKeys.length === 0
//     ) {
//         return res.status(400).send({ message: "Invalid measurement keys array." });
//     }

//     try {
//         // Fetch customer details
//         const customer = await Customer.findById(customerId);
//         if (!customer) {
//             return res.status(404).send({ message: "Customer not found." });
//         }

//         // Update latest order date
//         const today = new Date();
//         customer.orderDate = today;
//         await customer.save();

//         // Create a new PDF document
//         const doc = new PDFDocument({ margin: 30 });
//         const pdfFilePath = path.join(
//             __dirname,
//             "../public/uploads/",
//             Customer_${ customerId }.pdf
//         );
//         const stream = fs.createWriteStream(pdfFilePath);
//         doc.pipe(stream);

//         // Add PDF header
//         doc
//             .fontSize(16)
//             .text("Measurement Details", { align: "center" })
//             .moveDown();
//         doc
//             .fontSize(12)
//             .text(Name: ${ customer.name })
//             .text(City / Mauze: ${ customer.city } / ${ customer.mouze || "N/A" })
//             .text(Mobile: ${ customer.contactNo })
//             .text(ITS: ${ customer.itsNo || "N/A" })
//             .text(Order Date: ${ today.toDateString() })
//             .text(Remark: ${ customer.remarks || "N/A" })
//             .moveDown();

//         // Add Measurement Table Header
//         doc.fontSize(14).text("Measurements", { underline: true }).moveDown(0.5);

//         // Fetch measurement details
//         const measurement = await Measurement.findOne({ customers: customerId });
//         if (!measurement) {
//             doc.text("No measurements found.", { align: "center" });
//         } else {
//             // Filter the measurement object based on the passed keys
//             const filteredMeasurements = measurementKeys.reduce((acc, key) => {
//                 if (measurement[key]) {
//                     acc[key] = measurement[key];
//                 }
//                 return acc;
//             }, {});

//             if (Object.keys(filteredMeasurements).length === 0) {
//                 doc.text("No matching measurements found.", { align: "center" });
//             } else {
//                 // Draw table headers
//                 const tableStartX = 50; // Starting X position for the table
//                 const tableStartY = doc.y; // Starting Y position for the table
//                 const columnWidths = [100, 50, 50, 50, 50, 50, 50, 50, 50]; // Column widths for each field

//                 const headers = [
//                     "Garment Type",
//                     "Buttons",
//                     "Length",
//                     "Chest",
//                     "Shoulder",
//                     "Neck",
//                     "Sleeves",
//                     "Wrist",
//                     "Pocket",
//                 ];

//                 // Draw headers
//                 headers.forEach((header, index) => {
//                     doc
//                         .fontSize(10)
//                         .text(
//                             header,
//                             tableStartX +
//                             columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
//                             tableStartY,
//                             {
//                                 width: columnWidths[index],
//                                 align: "center",
//                             }
//                         );
//                 });

//                 doc.moveDown(1);

//                 // Draw measurement rows
//                 let currentY = tableStartY + 15; // Start below the headers
//                 Object.entries(filteredMeasurements).forEach(([key, value]) => {
//                     const rowValues = [
//                         key,
//                         value.buttons || "-",
//                         value.length || "-",
//                         value.chest || "-",
//                         value.shoulder || "-",
//                         value.neck || "-",
//                         value.sleeves || "-",
//                         value.wrist || "-",
//                         value.pocket || "-",
//                     ];

//                     rowValues.forEach((rowValue, index) => {
//                         doc
//                             .fontSize(10)
//                             .text(
//                                 rowValue,
//                                 tableStartX +
//                                 columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
//                                 currentY,
//                                 {
//                                     width: columnWidths[index],
//                                     align: "center",
//                                 }
//                             );
//                     });

//                     currentY += 15; // Move to the next row
//                 });
//             }
//         }

//         // Finalize the PDF
//         doc.end();

//         stream.on("finish", () => {
//             res.setHeader("Content-Type", "application/pdf");
//             res.setHeader(
//                 "Content-Disposition",
//                 inline; filename = Customer_${ customerId }.pdf
//         );
//         res.sendFile(pdfFilePath);
//     });
// } catch (error) {
//     console.error("Error generating PDF:", error);
//     res
//         .status(500)
//         .send({ message: "Server error while generating PDF.", error });
// }
//   };



module.exports = {
    combineData,
    monthlyCalendar,
    generateUserPdf
}