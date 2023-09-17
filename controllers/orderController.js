const orderHelper = require("../helpers/order-helper");
const cartHelper = require("../helpers/cart-helpers");
const userHelper = require("../helpers/user-helpers");
const exceljs = require('exceljs')
const PdfPrinter = require('pdfmake');
const fs = require('fs')
const easyinvoice = require("easyinvoice");
const { Readable } = require('stream');

const addOrder = async (req, res) => {
  try {
    let address = await userHelper.getAddress(
      req.session.user._id,
      req.body.addressId
    );
    address = address[0].address;
    let products = await cartHelper.getCartProducts(req.session.user._id);
    let total = await cartHelper.getTotal(req.session.user._id);
    total = total[0].total;
    total = parseInt(total)
    await orderHelper.placeOrder(
      req.session.user.name,
      req.session.user._id,
      address,
      products,
      total,
      req.body.paymentMode
    ).then(async (orderId) => {
      if (req.body.paymentMode === "COD") {
        res.json({ checkoutcomplete: true, orderId });
      } else {
        await orderHelper.generateRazorpay(orderId, total).then((response) => {
          res.json({response,orderId});
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

const orderPlaced = async (req, res) => {
  try {
    await orderHelper.clearCartAndStock(req.session.user._id, req.query.orderId)
    await orderHelper.changeOrderStatus(req.query.orderId);
    res.render("user/order-complete", {
      user: true,
      title: "Order Complete",
    });
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

const adminOrders = async (req, res) => {
  try {
    const orders = await orderHelper.getAllOrders();

    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.render("admin/adminOrders", {
      orders: paginatedOrders,
      currentPage,
      totalPages,
      pages,
      admin: true,
      title: "Admin Orders",
    });
  } catch (err) {
    console.log(err);
    res.render('error-404')
  }
};

const adminGetOrder = async (req, res) => {
  try {
    try {
      const orderId = req.query.orderId;
      const order = await orderHelper.getOrderById({ _id: orderId });
      if (!order) {
        return res.redirect("/admin");
      }
      res.render("admin/adminOrders-edit", {
        order: order,
        admin: true,
        title: "Admin Edit Order",
      });
    } catch (err) {
      console.log(err);
      res.redirect("/adminOrders");
    }
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const adminGetOrderProducts = async (req, res) => {
    try {
      const orderId = req.query.orderId;
      const order = await orderHelper.getOrderById({ _id: orderId });
      const orderProducts = order.products
      res.json({orderProducts})
    } catch (err) {
      console.log(err);
      res.render('error-404')
    }
};

const adminEditOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const formData = req.body;
    let commonProductStatus = null;
    let count = 0;
    let check = 0;
    for (const key in formData) {
      if (key.startsWith("productStatus_")) {
        const productId = key.replace("productStatus_", "");
        const productStatus = formData[key];
        check++;
        if (
          commonProductStatus === null ||
          commonProductStatus === productStatus
        ) {
          commonProductStatus = productStatus;
          count++;
        }
        await orderHelper.updateProductStatus(
          orderId,
          productId,
          productStatus
        );
      }
    }
    if (check === count) {
      await orderHelper.updateOrder(orderId, { status: commonProductStatus });
    }
    res.redirect("/admin/admin-orders");
  } catch (error) {
    console.log(error.message);
    res.render("error-404");
  }
};

const requestProductCancellation = async (req,res) => {
  try {
    const productStatus =  "Req Cancel" 
    await orderHelper.userUpdateProductStatus(
      req.query.orderId,
      req.query.productId,
      productStatus
      );
      res.redirect("/profile-orders");
    } catch (error) {
      console.log(error)
    }
  }
  
  const requestProductReturn = async (req,res) => {
    try {
    const productStatus =  "Req Return" 
    await orderHelper.userUpdateProductStatus(
      req.query.orderId,
      req.query.productId,
      productStatus
      );
      res.redirect("/profile-orders");
  } catch (error) {
    console.log(error)
  }
}

const getOrders = async (req, res) => {
  try {
    const orders = await orderHelper.getOrders(req.session.user._id);

    const itemsPerPage = 3;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = orders.slice(startIndex, endIndex);
    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    res.render("user/ordermanagement", {
      currentPage,
      totalPages,
      pages,
      orders: paginatedOrders,
      user: true,
      title: "Order Management",
    });
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const requestCancellation = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderdetails = {
      status: "Req Cancellation",
    };
    await orderHelper.updateOrder(orderId, orderdetails);
    res.redirect("/profile-orders");
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const requestReturn = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    console.log(req.query.orderId)
    const orderdetails = {
      status: "Req Return",
    };
    await orderHelper.updateOrder(orderId, orderdetails);
    res.redirect("/profile-orders");
  } catch (error) {
    console.log(error.message);
    res.render('error-404')
  }
};

const verifyPayment = (req, res) => {
  orderHelper
    .verifyPayment(req.body)
    .then(async () => {
      await orderHelper
        .changePaymentStatus(req.body.order.receipt)
        .then(() => {
          res.json({ status: true });
        });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: "Payment failed" });
    });
};

const todaySaleExcel = async (req, res) => {
  try {
    const totalSaleToday = await orderHelper.totalSaleToday();
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("orders");
    // Define the header columns
    const columns = [
      { header: "S:no", key: "s_no" },
      { header: "Id", key: "_id" },
      { header: "User Id", key: "userId" },
      { header: "Product", key: "product" },
      { header: "Quantity", key: "quantity" },
      { header: "Total", key: "totalAmount" },
      { header: "Payment Method", key: "paymentMethod" },
      { header: "Delivered Date", key: "deliveredDate" },
      { header: "Order Date", key: "orderDate" },
    ];
    // Set the columns
    worksheet.columns = columns;
    let s_no = 1; // Initialize a counter
    // Flatten and add data to the worksheet
    totalSaleToday.forEach((order) => {
      order.products.forEach((product) => {
        worksheet.addRow({
          s_no: s_no++,
          _id: order._id,
          userId: order.user,
          product: product.item, // Access 'product' from the nested structure
          quantity: product.quantity, // Access 'quantity' from the nested structure
          totalAmount: order.subTotal,
          paymentMethod: order.paymentMode,
          deliveredDate: order.deliveredDate,
          orderDate: order.orderDate,
        });
      });
    });
    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    // Set response headers for download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment;filename=Today's_Sales.xlsx");
    // Send the workbook as a response
    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const totalRevenueExcel = async (req, res) => {
  try {
    const allOrder = await orderHelper.findOrdersDelivered();
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("orders");
    const columns = [
      { header: "S:no", key: "s_no" },
      { header: "Order Id", key: "_id" },
      { header: "User Id", key: "userId" },
      { header: "Total", key: "totalAmount" },
      { header: "Payment Method", key: "paymentMethod" },
      { header: "Delivered Date", key: "deliveredDate" },
      { header: "Order Date", key: "orderDate" },
    ];
    // Set the columns
    worksheet.columns = columns;
    let s_no = 1; // Initialize a counter
    // Flatten and add data to the worksheet
    allOrder.forEach((order) => {
      order.products.forEach((product) => {
        worksheet.addRow({
          s_no: s_no++,
          _id: order._id,
          userId: order.user,
          totalAmount: order.subTotal,
          paymentMethod: order.paymentMode,
          deliveredDate: order.deliveredDate,
          orderDate: order.orderDate,
        });
      });
    });
    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment;filename=Total_Revenue.xlsx");
    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    });
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const allOrderStatus = async (req, res) => {
  try {
    const allOrder = await orderHelper.getAllOrders();
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("allOrder");
    const columns = [
      { header: "S:no", key: "s_no" },
      { header: "Id", key: "_id" },
      { header: "User Id", key: "userId" },
      { header: "Product", key: "product" },
      { header: "Quantity", key: "quantity" },
      { header: "Total", key: "totalAmount" },
      { header: "Payment Method", key: "paymentMethod" },
      { header: "Delivered Date", key: "deliveredDate" },
      { header: "Order Date", key: "orderDate" },
    ];
    // Set the columns
    worksheet.columns = columns;
    let s_no = 1; // Initialize a counter
    // Flatten and add data to the worksheet
    allOrder.forEach((order) => {
      order.products.forEach((product) => {
        worksheet.addRow({
          s_no: s_no++,
          _id: order._id,
          userId: order.user,
          product: product.item, // Access 'product' from the nested structure
          quantity: product.quantity, // Access 'quantity' from the nested structure
          totalAmount: order.subTotal,
          paymentMethod: order.paymentMode,
          deliveredDate: order.deliveredDate,
          orderDate: order.orderDate,
        });
      });
    });
    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment;filename=All_Orders.xlsx");
    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    });
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const orderDetailPDF = async (req, res) => {
  try {
    const allOrder = await orderHelper.findOrdersDelivered_populated();
    let totalAmount = 0;
    if (allOrder && allOrder.length > 0) {
      totalAmount = allOrder.reduce(
        (total, order) => total + order.subTotal,
        0
      );
    }
    res.render("./admin/salesPDF", { admin: true, orders: allOrder, totalAmount, title:"Sales Report - Order View" });
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const customPDF = async (req, res) => {
  try {
    const startDate = req.query.start; // Get the starting date from the query parameters
    const endDate = req.query.end; // Get the ending date from the query parameters
    const allOrder = await orderHelper.findOrderByDate(startDate, endDate);
    // console.log(startDate,endDate,'no:',allOrder.length,allOrder,"order pdf")

    const writeStream = fs.createWriteStream("order.pdf");
    const printer = new PdfPrinter({
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    });

    const dateOptions = { year: "numeric", month: "long", day: "numeric" };

    // Create document definition
    const docDefinition = {
      content: [
        { text: "PixelCart", style: "header" },
        { text: "\n" },
        { text: "Order Information", style: "header1" },
        { text: "\n" },
        { text: "\n" },
      ],
      styles: {
        header: {
          fontSize: 25,
          alignment: "center",
        },
        header1: {
          fontSize: 12,
          alignment: "center",
        },
        total: {
          fontSize: 18,
          alignment: "center",
        },
      },
    };
    // Create the table data
    const tableBody = [
      ["Index", "Date", "User", "address", "Status", "PayMode", "Amount"], // Table header
    ];
    let totalAmount = 0;
    for (let i = 0; i < allOrder.length; i++) {
      const data = allOrder[i];
      totalAmount = totalAmount + data.subTotal;
      const formattedDate = new Intl.DateTimeFormat(
        "en-US",
        dateOptions
      ).format(new Date(data.deliveredDate));
      tableBody.push([
        (i + 1).toString(), // Index value
        formattedDate,
        data.userName,
        data.orderAddress.address,
        data.status,
        data.paymentMode,
        totalAmount,
      ]);
    }
    const table = {
      table: {
        widths: ["auto", "auto", "auto", "auto", "auto", "auto", "auto"],
        headerRows: 1,
        body: tableBody,
      },
    };
    // Add the table to the document definition
    docDefinition.content.push(table);
    docDefinition.content.push([
      { text: "\n" },
      { text: `Total:${totalAmount}`, style: "total" },
    ]);
    // Generate PDF from the document definition
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    // Pipe the PDF document to a write stream
    pdfDoc.pipe(writeStream);
    // Finalize the PDF and end the stream
    pdfDoc.end();
    writeStream.on("finish", () => {
      res.download("order.pdf", "order.pdf");
    });
  } catch (error) {
    console.log(error);
    res.render("error-404");
  }
};

const getOrderInvoice = async (req, res) => {
  try {
    const id = req.query.id;
    let result = await orderHelper.getOrderById(id);
    const date = result.orderDate.toLocaleDateString();
    const order = {
      id: id,
      total: parseInt(result.subTotal),
      date: date,
      payment: result.paymentMode,
      name: result.orderAddress.billingAddressName,
      address: result.orderAddress.address,
      townCity: result.orderAddress.townCity,
      country: result.orderAddress.country,
      pincode: result.orderAddress.zipPostalCode,
      product: result.products,
    };

    const products = order.product.map((product) => ({
      quantity: parseInt(product.quantity),
      description: product.name,
      "tax-rate": 0,
      price: parseInt(product.price),
    }));

    var data = {
      customize: {},
      images: {
        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },

      sender: {
        company: "PixelCart",
        address: "lulu Mall, Edapally, Kochi, Kerala",
        zip: "682021",
        city: "Ernakulan",
        country: "India",
      },

      client: {
        company: order.name,
        address: order.address,
        zip: order.pincode,
        city: order.townCity,
        country: order.country,
      },
      information: {
        number: order.id,
        date: order.date,
        "due-date": "Nil",
      },

      products: products,
      // The message you would like to display on the bottom of your invoice
      "bottom-notice": "Thank you, Keep shopping.",
    };
    result = Object.values(result);

    easyinvoice
      .createInvoice(data, async (result) => {
        //The response will contain a base64 encoded PDF file
        if (result && result.pdf) {
          fs.writeFileSync("invoice.pdf", result.pdf, "base64");

          // Set the response headers for downloading the file
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="invoice.pdf"'
          );
          res.setHeader("Content-Type", "application/pdf");

          // Create a readable stream from the PDF base64 string
          const pdfStream = new Readable();
          pdfStream.push(Buffer.from(result.pdf, "base64"));
          pdfStream.push(null);

          // Pipe the stream to the response
          pdfStream.pipe(res);
        } else {
          // Handle the case where result.pdf is undefined or empty
          res.status(500).send("Error generating the invoice");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  addOrder,
  orderPlaced,
  adminOrders,
  adminGetOrder,
  adminEditOrder,
  requestProductCancellation,
  requestProductReturn,
  getOrders,
  requestCancellation,
  requestReturn,
  verifyPayment,
  adminGetOrderProducts,
  todaySaleExcel,
  totalRevenueExcel,
  allOrderStatus,
  orderDetailPDF,
  customPDF,
  getOrderInvoice
};
