console.log('Hello from imap_node!');
console.log('Please stand by while I connect to your email server...\n\n');

var fs = require('fs');
var Imap = require('imap');
var inspect = require('util').inspect;
var MailParser = require("mailparser").MailParser;
var userInfo = require("./userinfo_rbaine");


var imap = new Imap({
  user: userInfo.getUID(),
  password: userInfo.getPWD(),
  host: 'imap.symbience.com',
  port: 143,
  tls: false
});



function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}



imap.once('ready', function () {
  openInbox(function (err, box) {
    if (err) {
      throw err;
    }



    // // all by msg id
    var f = imap.seq.fetch('1:*', {
      bodies: '',
      struct: true,
      markSeen: true
    });

    f.on('message', function (msg, seqno) {
      var prefix = '(#' + seqno + ') ';
      msg.on('body', function (stream, info) {
        var buffer = '';

        stream.on('data', function (chunk) {
          buffer += chunk.toString('utf8');
        });

        stream.once('end', function () {
          var mailparser = new MailParser({
            streamAttachments: true
          });

          // mailparser.on("attachment", function (attachment, mail) {
          //   // var output = fs.createWriteStream(attachment.generatedFileName);
          //   // attachment.stream.pipe(output);
          // });

          mailparser.on('end', function (mail_object) {
            console.log("      Msg #:\t", prefix);
            console.log("         To:\t", mail_object.to[0].address); //[{address:'sender@example.com',name:'Sender Name'}]
            console.log("       From:\t", mail_object.from[0].address); //[{address:'sender@example.com',name:'Sender Name'}]
            console.log("       Date:\t", mail_object.date); //[{address:'sender@example.com',name:'Sender Name'}]
            console.log("    Subject:\t", mail_object.subject); // Hello world!

            // if (mail_object.text != undefined && mail_object.text.length != 0) {
            //   console.log("  Text body:\n", mail_object.text.trim().replace('                   ', '')); 
            // } else {
            //   if (mail_object.html != undefined && mail_object.html.length != 0) {
            //     console.log("  HTML body:\n", mail_object.html.trim()); 
            //   }
            // } 

            if (mail_object.attachments !== undefined) {
              mail_object.attachments.forEach(function (attachment) {
                if (attachment.fileName !== undefined) {
                  console.log("       File:\t", attachment.fileName + '\n');
                };
              });
            };

            console.log('\n');

          }); // mailparser.on('end

          mailparser.write(buffer.toString());
          mailparser.end();

        }); // end stram.conce('end')
      }); // end msg.on('body')

      msg.once('attributes', function (attrs) {
        //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
      });

      msg.once('end', function () {
        // console.log(prefix + 'Finished');
      });

    }); // end f.one

    f.once('error', function (err) {
      console.log('Fetch error: ' + err);
    });

    f.once('end', function () {
      // console.log('\n\nDone fetching all messages!');
      imap.end();
    });



    imap.once('error', function (err) {
      console.log(err);
    });

    imap.once('end', function () {
      console.log('Connection ended');
    });

  }); // end open inBox
}); // end imap.once('ready')

imap.connect();