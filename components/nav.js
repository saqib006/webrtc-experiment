import React, { Component } from 'react'
import {AppBar, Toolbar, Typography, IconButton , Button} from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu';
export default class nav extends Component {
  render() {
    return (
      <div>
        <AppBar position="static">
        <Toolbar>
          <IconButton  color="inherit" aria-label="Menu">
            <MenuIcon />
          </IconButton>
          <Typography style={{flexGrow:1}} variant="h6" color="inherit" >
            WebRTC
          </Typography>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
      </div>
    )
  }
}
