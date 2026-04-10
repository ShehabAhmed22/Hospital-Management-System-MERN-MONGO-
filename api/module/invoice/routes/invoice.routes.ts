import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware";
import {
  getMyActiveInvoice,
  getBillingHistory,
  allBilling,
  markInvoiceAsPaid,
} from "../controller/invoice.controller";
import { checkRole } from "../../../middlewares/checkRole";

const invoiceRouter = Router();

invoiceRouter.get(
  "/my-active-invoice",
  requireAuth,
  checkRole(["patient"]),
  getMyActiveInvoice,
);
invoiceRouter.get("/", requireAuth, checkRole(["admin"]), allBilling);
invoiceRouter.get("/history/:id", requireAuth, getBillingHistory);
invoiceRouter.patch(
  "/:id/mark-paid",
  requireAuth,
  checkRole(["admin"]),
  markInvoiceAsPaid,
);

export default invoiceRouter;
