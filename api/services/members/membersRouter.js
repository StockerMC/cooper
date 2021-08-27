import { Router } from "express";
import ElectionHelper from "../../../operations/members/hierarchy/election/electionHelper";
import { USERS } from '../../../origin/coop';



const MembersRouter = Router();

MembersRouter.get('/hierarchy', async (req, res) => {
    const hierarchy = await ElectionHelper.loadHierarchy();

    // Add the next 10 members who weren't already included.
    // TODO: Lock down some unnecessary fields.
    const otherUsersRaw = await USERS.loadSortedHistoricalPoints();
    hierarchy.other_users = otherUsersRaw;

    res.status(200).json(hierarchy);
});

export default MembersRouter;