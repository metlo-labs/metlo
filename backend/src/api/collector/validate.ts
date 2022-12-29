import { Response } from "express";
import { MetloRequest } from "types";

// If call reaches this function, then API key has been verified.
export function validateCall(req: MetloRequest, res: Response) {
    res.send("OK")
}