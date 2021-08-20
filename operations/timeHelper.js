import moment from 'moment';
import Sugar from 'sugar';

Sugar.extend();

export default class TimeHelper {

    // Take human readable due time.
    static parseHuman(str) {
		const date = Sugar.Date.create(str);
        return date;
    }

    static secsLongFmt(secs) {
        const secsMoment = moment.unix(secs);
        return secsMoment.format('dddd, MMMM Do YYYY, h:mm:ss a');
    }

    static humaniseSecs(secs) {
        const humanRemaining = moment.duration(secs * 1000).humanize();
        return humanRemaining;
    }

    static _secs() {
        const presentSecs = Math.round(Date.now() / 1000);
        return presentSecs;
    }

    static weeksUntilStr(dateStr) {
        const date = this.parseHuman(dateStr);
		return Math.abs(date.weeksUntil());
    }
}