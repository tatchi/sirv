const sirv = require('sirv');
const colors = require('clorox');
const { resolve } = require('path');
const clear = require('console-clear');
const { find } = require('port-authority');
const access = require('local-access');

const PAD = '  ';

function toMS(arr) {
	return colors.white.bold(`${(arr[1] / 1e6).toFixed(2)}ms`);
}

function toCode(code) {
	let fn = code > 400 ? 'red' : code > 300 ? 'yellow' : 'green';
	return colors[fn](code);
}

module.exports = function (dir, opts) {
	dir = resolve(dir || '.');

	let server = sirv(dir, opts);
	let { hrtime, stdout } = process;

	if (!opts.quiet) {
		let uri, dur, start, dash=colors.gray(' ─ ');
		server.on('request', (req, res) => {
			start = hrtime();
			req.once('end', _ => {
				dur = hrtime(start);
				uri = req.originalUrl || req.url;
				stdout.write(PAD + toCode(res.statusCode) + dash + toMS(dur) + dash + uri + '\n');
			});
		});
	}

	find(opts.port).then(port => {
		let https = !!opts.ssl; // TODO
		let isOther = port !== opts.port;
		server.listen(port, err => {
			if (err) throw err;
			if (opts.quiet) return;

			clear(); // wipe screen
			let { local, network } = access({ port, https });
			stdout.write('\n' + PAD + colors.green('Your application is ready~! 🚀\n\n'));
			isOther && stdout.write(PAD + colors.italic.dim(`➡ Port ${opts.port} is taken; using ${port} instead\n\n`));
			stdout.write(PAD + `${colors.bold('- Local:')}      ${local}\n`);
			stdout.write(PAD + `${colors.bold('- Network:')}    ${network}\n`);
			let border = '─'.repeat(Math.min(stdout.columns, 36) / 2);
			stdout.write('\n' + border + colors.inverse(' LOGS ') + border + '\n\n');
		});
	});
}