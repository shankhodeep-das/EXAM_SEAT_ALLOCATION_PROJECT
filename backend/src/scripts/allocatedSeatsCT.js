const {
    disconnectPrisma,
    runSeatingAllocation
} = require("./allocateSeats");

const MAX_SECTIONS_PER_ROOM = 5;

function parseMaxSections(args) {
    let maxSectionsPerRoom = 2;
    let argumentError = null;

    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === "--max-sections") {
            maxSectionsPerRoom = Number(args[index + 1]);
            index++;
        } else if (argument.startsWith("--max-sections=")) {
            maxSectionsPerRoom = Number(argument.slice("--max-sections=".length));
        } else {
            argumentError = `Unknown option: ${argument}`;
            break;
        }
    }

    if (
        argumentError ||
        !Number.isInteger(maxSectionsPerRoom) ||
        maxSectionsPerRoom < 1 ||
        maxSectionsPerRoom > MAX_SECTIONS_PER_ROOM
    ) {
        if (argumentError) console.error(argumentError);
        if (
            !Number.isInteger(maxSectionsPerRoom) ||
            maxSectionsPerRoom < 1 ||
            maxSectionsPerRoom > MAX_SECTIONS_PER_ROOM
        ) {
            console.error(
                `Maximum sections per room must be an integer from 1 to ${MAX_SECTIONS_PER_ROOM}.`
            );
        }
        console.error(
            "Usage: node allocatedSeatsCT.js [--max-sections=1..5]"
        );
        return null;
    }

    return maxSectionsPerRoom;
}

if (require.main === module) {
    const maxSectionsPerRoom = parseMaxSections(process.argv.slice(2));

    if (maxSectionsPerRoom === null) {
        process.exitCode = 1;
        disconnectPrisma().catch(error => {
            console.error(
                "Unable to close Prisma after invalid allocation options:",
                error
            );
        });
    } else {
        runSeatingAllocation(undefined, maxSectionsPerRoom, {
            groupBy: "section",
            reportFile: "seat-allocation-CT.txt"
        })
            .catch(error => {
                console.error(error);
                process.exitCode = 1;
            })
            .finally(disconnectPrisma);
    }
}

module.exports = { parseMaxSections };
