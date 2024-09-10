import FS from "fs";

export function logging(text){
	console.log(text+'\n');
	let date = new Date(Date.now());

    let dd = date.getDate();
    let mm = date.getMonth() + 1;
    let yyyy = date.getFullYear();
    let hours = date.getHours();
    let mins = date.getMinutes();
    let secs = date.getSeconds();
    let millisecs = date.getMilliseconds();

    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    if (hours < 10) {
        hours = '0' + hours;
    }
    if (mins < 10) {
        mins = '0' + mins;
    }
    if (secs < 10) {
        secs = '0' + secs;
    }
    if (millisecs < 10) {
        millisecs = '00' + millisecs;
    }
    if (millisecs < 100) {
        millisecs = '0' + millisecs;
    }

	let fullLog = hours+":"+mins+":"+secs+"."+millisecs+"     "+text+"\n\n";

	let logFiles = FS.readdirSync("./logs/");
	let fileName = dd+'-'+mm+'-'+yyyy+'.txt';
	if (!logFiles.includes(fileName)){
		FS.appendFileSync("./logs/"+fileName,fullLog);
	} else {
		let oldLog = FS.readFileSync("./logs/"+fileName);
		let newLog = oldLog + fullLog;
		FS.writeFileSync("./logs/"+fileName,newLog);
	}
}