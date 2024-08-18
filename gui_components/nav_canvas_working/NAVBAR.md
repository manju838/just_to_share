

```
<div className="hamburger-menu" onClick={toggleMenu}>
                    <div className="hamburger-bar"></div>
                    <div className="hamburger-bar"></div>
                    <div className="hamburger-bar"></div>
</div>
```





<div className="navbar">
                <div className="hamburger-menu" onClick={toggleMenu}>
                    <div className="hamburger-bar"></div>
                    <div className="hamburger-bar"></div>
                    <div className="hamburger-bar"></div>
                </div>

                {activePage === 'Edit Floorplan' && (
                    <div className="buttons">
                        <button className="nav-button">Draw Wall</button>
                        <button className="nav-button">Move Wall</button>
                        <button className="nav-button">Delete Wall</button>
                    </div>
                )}
            </div>
```