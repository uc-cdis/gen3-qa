/* eslint-disable */
$(() => {
  String.prototype.insert = function (index, string) {
    if (index > 0)
      return this.substring(0, index) + string + this.substring(index, this.length);

    return string + this;
  };

  $(".qrtrFltr").click(function () {
    $('.mainbar').empty();
    var [quarter, year] = $(this).text().split(" ");
    fetch(`https://qa.planx-pla.net/dashboard/Secure/QA/${year}/${quarter}/`).then(
      (r) => {
        if (r.status === 401) {
          window.location.replace("https://qa.planx-pla.net/login/?next=/dashboard/Secure/qa-reports/index.html");
        }
        return r.json()
      }
    ).then(
      (files) => {
        let reports = {};
        files.forEach((file) => {
          const fileInfo = file.split("/");
          const month = parseInt(fileInfo[0]);
          const nameOfTheFolder = fileInfo[1]; // unique
          if (month && nameOfTheFolder) {
            const regex = new RegExp(".+_(.+_.+)$");
            const dateAndTimeStr = regex.exec(nameOfTheFolder)[1];
            const timestamp = new Date(
              dateAndTimeStr.replace('_', ' ')
                .insert(4, "/")
                .insert(7, "/")
                .insert(13, ":")
                .insert(16, ":"));
            if (!(nameOfTheFolder in reports)) {
              // eliminate duplicate entries and map reports
              reports[nameOfTheFolder] = {
                "nameOfTheFolder": nameOfTheFolder,
                "month": month,
                "timestamp": timestamp,
                "url": `/dashboard/Secure/QA/${year}/${quarter}/${month}/${nameOfTheFolder}/index.html`
              };
            }
          }
        });
    
        let currMonth = 0;
	const monthsDigitToString = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
	var result = Object.keys(reports)
          .sort((a, b) => reports[a].timestamp - reports[b].timestamp)
          .map((reportKey) => {
            const report = reports[reportKey];
	    report_html_block = `<div id="${report.nameOfTheFolder}">
                        <h3><span>${report.nameOfTheFolder.split('_').slice(0, -2).join(' ')}</span></h3>
                        <a href="${report.url}">${report.nameOfTheFolder}</a>
                      </div>`;
            if (!(report.month === currMonth)) {
              $('.mainbar').append(`<div id="${report.year}_${report.month}" class="report">
                           <h2><span>${monthsDigitToString[report.month - 1]} ${year}</span></h2>
                          </div>`);
              currMonth = report.month;
            }
            monthId = `#${report.year}_${report.month}`;
            $(`#${report.year}_${report.month}`).append(report_html_block);
	  });

      }
    );
  });
});
