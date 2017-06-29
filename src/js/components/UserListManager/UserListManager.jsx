import React from "react";
import "./userListManager.sass";
import * as global from "../../app/global";
import IO from "../../app/IO";
import TVMazeAPI from "../../app/TVMazeAPI";
import Settings from "../../app/Settings";

const io = new IO;
const tvm = new TVMazeAPI;
const settings = new Settings;

class UserListManager extends React.Component {
    constructor() {
        super();

        this.entryData = [];
        this.state = {
            collection: []
        };
        this.LABEL_DATESTAMP_NOT_AVAILABLE = "Unavailable";
    }

    componentWillMount() {
        this.entryData = io.read(global.userItems);
    }

    componentDidMount() {
        this.handleDates();
        this.prepareTemplate();
    }

    componentWillUnmount() {
        let tooltips = document.querySelectorAll(".material-tooltip");

        for (let tooltip of tooltips) {
            tooltip.remove();
        }
    }

    render() {
        if ($(".tooltippped").length > 0)
            $(".tooltipped").tooltip();

        return (
            <div className="row userListManager">
                <table className="highlight centered col s12">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Season</th>
                            <th>Episode</th>
                            <th>Release</th>
                            <th>Interactions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.collection}
                    </tbody>
                </table>
            </div>
        );
    }

    prepareTemplate() {
        let currentCollection = this.entryData;

        if (currentCollection === "") return;

        currentCollection = currentCollection.map((item, i) => {
            let stamp;

            if (!item.airstamp || item.airstamp === "Not found") stamp = this.LABEL_DATESTAMP_NOT_AVAILABLE;
            else stamp = settings.formatDate(new Date(item.airstamp)).toString();

            return (
                <tr key={i}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.season}</td>
                    <td>{item.episode}</td>
                    <td>{stamp}</td>
                    <td className="iconContainer">
                        <a href="#userlistmanager" className="tooltipped iconContainer__icon" data-position="top" data-delay="50" data-tooltip="Increment season"><i onClick={this.handleSeasonInteraction.bind(this)} data-mode="increment" data-entry={i} className="fa fa-plus"></i></a>
                        <a href="#userlistmanager" className="tooltipped iconContainer__icon" data-position="top" data-delay="50" data-tooltip="Decrement season"><i onClick={this.handleSeasonInteraction.bind(this)} data-mode="decrement" data-entry={i} className="fa fa-minus"></i></a>
                        <a href="#userlistmanager" className="tooltipped iconContainer__icon" data-position="top" data-delay="50" data-tooltip="Increment episode"><i onClick={this.handleEpisodeInteraction.bind(this)} data-mode="increment" data-entry={i} className="fa fa-plus"></i></a>
                        <a href="#userlistmanager" className="tooltipped iconContainer__icon" data-position="top" data-delay="50" data-tooltip="Decrement episode"><i onClick={this.handleEpisodeInteraction.bind(this)} data-mode="decrement" data-entry={i} className="fa fa-minus"></i></a>
                        <a href="#userlistmanager" className="tooltipped iconContainer__icon" data-position="top" data-delay="50" data-tooltip="Remove entry"><i onClick={this.handleItemRemove.bind(this)} data-entry={i} className="fa fa-times"></i></a>
                    </td>
                </tr>
            );
        });

        this.setState({collection: currentCollection});
    }

    handleItemRemove(e) {
        e.preventDefault();

        let currentCollection = this.state.collection;
        let index = e.target.getAttribute("data-entry");

        io.removeEntry(global.userItems, index);
        currentCollection.splice(index, 1);

        this.setState({collection: currentCollection});
    }

    handleSeasonInteraction(e) {
        e.preventDefault();

        const mode = e.target.getAttribute("data-mode");

        let index = e.target.getAttribute("data-entry");
        const entryData = this.entryData;
        let entry = entryData[index];
        let season = parseInt(entry.season);

        if (mode === "increment")
            season += 1;
        else if (mode === "decrement")
            season -= 1;
        else
            throw "data-mode not set in interaction";

        season = season.toString();
        entry.season = season;

        io.changeEntry(global.userItems, index, entry);

        this.handleDates(index);
    }

    handleEpisodeInteraction(e) {
        e.preventDefault();

        const mode = e.target.getAttribute("data-mode");

        let index = e.target.getAttribute("data-entry");
        const entryData = this.entryData;
        let entry = entryData[index];
        let episode;

        episode = parseInt(entry.episode);

        if (mode === "increment")
            episode += 1;
        else if (mode === "decrement")
            episode -= 1;
        else
            throw "data-mode not set in interaction";

        entry.episode = episode.toString();

        io.changeEntry(global.userItems, index, entry);

        this.handleDates(index);
    }

    handleDates(entry) {
        if (!entry) {
            tvm.searchForShows(this.entryData).then((response) => {
                for (let i = 0; i <= response.length - 1; i++) {
                    this.entryData[i].id = (response[i].data.id);
                }
            }).then(() => {
                let temp = 0;

                for (let i = 0; i <= this.entryData.length - 1; i++) {
                    tvm.getEpisode(this.entryData[i].id, this.entryData[i].season, this.entryData[i].episode).then((response) => {
                        temp = response.data.airstamp;
                    }).then(() => {
                        if (temp)
                            this.entryData[i].airstamp = temp;

                        if (i === this.entryData.length - 1)
                            this.prepareTemplate();
                    }).catch((err) => {
                        if (i === this.entryData.length - 1)
                            this.prepareTemplate();
                    });
                }
            });
        } else {
            let showID = 0;

            tvm.getSingleShowByName(this.entryData[entry].name).then((response) => {
                showID = response.data.id;
            }).then(() => {
                tvm.getEpisode(showID, this.entryData[entry].season, this.entryData[entry].episode).then((response) => {
                    this.entryData[entry].airstamp = response.data.airstamp;
                }).then(() => {
                    this.prepareTemplate();
                }).catch(() => {
                    delete this.entryData[entry].airstamp;
                    this.prepareTemplate();
                });
            });
        }
    }
}

module.exports = UserListManager;