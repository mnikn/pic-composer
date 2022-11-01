import * as d3 from "d3";
import { useEffect, useLayoutEffect, useState } from "react";
import styled, { css } from "styled-components";
import * as monaco from "monaco-editor";

const StyledApp = styled.div`
  position: relative;
  .sidebar {
    position: absolute;
    left: 24px;
    top: 24px;
    width: 500px;
  }

  .banner {
    left: 600px;
    top: 24px;
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    background-size: cover;
    z-index: 1;

    .textarea {
      border: none;
      resize: none;
    }
  }

  .config-list {
    height: 500px;
    overflow: auto;
  }
  ${({ extraStyle }) => css`
    ${extraStyle}
  `};
`;

const FieldDefaultConfig = {
  text: {
    type: "text",
    style: ".field-container {\r\n    .input {}\r\n}",
    pos: { x: 100, y: 100 },
    key: "",
    containerClassName: "",
    labelClassName: "",
    itemClassName: "",
    value: "",
    dragable: true,
  },
  textarea: {
    type: "textarea",
    style: ".field-container {\r\n    .textarea {}\r\n}",
    pos: { x: 100, y: 100 },
    key: "",
    containerClassName: "",
    labelClassName: "",
    itemClassName: "",
    value: "",
    dragable: true,
  },
  list: {
    type: "list",
    style: ".field-container {\r\n    ul {}\r\n    ol {}\r\n    li {}\r\n}",
    pos: { x: 100, y: 100 },
    key: "",
    isNumberIndex: false,
    containerClassName: "",
    labelClassName: "",
    listClassName: "",
    itemClassName: "",
    value: [],
    dragable: true,
  },
  pic: {
    type: "pic",
    style: ".field-container {\r\n    .pic { }\r\n}",
    pos: { x: 100, y: 100 },
    key: "",
    isNumberIndex: false,
    containerClassName: "",
    labelClassName: "",
    itemClassName: "",
    value: "",
    dragable: true,
  },
  custom: {
    type: "custom",
    style: ".field-container {\r\n    .container {}\r\n}",
    pos: { x: 100, y: 100 },
    key: "",
    isNumberIndex: false,
    containerClassName: "",
    value: "",
    dragable: true,
  },
};

const StyledContainerWrapper = styled.div`
  ${({ extraStyle }) => css`
    ${extraStyle}
  `};
`;

const StyledContainer = styled.div`
  position: absolute;
  cursor: pointer;
  transition: border 0.2s ease-out;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0);
  &:hover {
    border: 2px solid #2c2c2c;
  }
`;

async function toDataURL(url) {
  return new Promise((resolve) => {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var reader = new FileReader();
      reader.onloadend = function () {
        resolve(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();
  });
}

function App() {
  const [globalSettings, setGlobalSettings] = useState(
    localStorage.getItem("global_settings")
      ? JSON.parse(localStorage.getItem("global_settings"))
      : {
          style: ".banner {}",
          pic: "",
          width: 800,
          height: 800,
        }
  );
  const [schema, setSchema] = useState(
    localStorage.getItem("schema")
      ? JSON.parse(localStorage.getItem("schema"))
      : [{ ...FieldDefaultConfig.text }]
  );

  useEffect(() => {
    localStorage.setItem("schema", JSON.stringify(schema, null, 2));
    localStorage.setItem(
      "global_settings",
      JSON.stringify(globalSettings, null, 2)
    );
  }, [schema, globalSettings]);

  const [codeEditorVisible, setCodeEditorVisible] = useState(false);
  const [codeEditorContent, setCodeEditorContent] = useState("");
  const [codeEditorConfig, setCodeEditorConfig] = useState({
    onSubmit: () => {},
    initialValue: "",
    language: "scss",
  });

  useLayoutEffect(() => {
    const dom = document.getElementById("code-editor");
    if (!codeEditorVisible || !dom || !codeEditorConfig) {
      return;
    }

    setCodeEditorContent(codeEditorConfig.initialValue);
    const editor = monaco.editor.create(dom, {
      value: codeEditorConfig.initialValue,
      language: codeEditorConfig.language,
      theme: "vs-dark",
    });
    editor.onDidChangeModelContent((e) => {
      setCodeEditorContent(editor.getValue());
    });
  }, [codeEditorVisible, codeEditorConfig]);

  let bannerStyle = {
    width: globalSettings.width + "px",
    height: globalSettings.height + "px",
  };
  if (globalSettings.pic) {
    bannerStyle.backgroundImage = `url(${globalSettings.pic})`;
  }
  return (
    <StyledApp id="app" extraStyle={globalSettings.style}>
      <div className="banner" style={bannerStyle}>
        {schema.map((item) => {
          return (
            <StyledContainerWrapper extraStyle={item.style}>
              <StyledContainer
                className={"field-container " + item.containerClassName || ""}
                style={{
                  left: item.pos.x,
                  top: item.pos.y,
                }}
                draggable={item.dragable}
                ref={(dom) => {
                  if (item.dragable) {
                    const dragListener = d3.drag().on("drag", (val) => {
                      item.pos.x += val.dx;
                      item.pos.x = Math.max(0, item.pos.x);
                      item.pos.x = Math.min(
                        globalSettings.width - dom.clientWidth,
                        item.pos.x
                      );
                      item.pos.y += val.dy;
                      item.pos.y = Math.max(0, item.pos.y);
                      item.pos.y = Math.min(
                        globalSettings.height - dom.clientHeight,
                        item.pos.y
                      );
                      item.pos = { ...item.pos };
                      setSchema((prev) => {
                        return [...prev];
                      });
                    });
                    dragListener(d3.select(dom));
                  }
                }}
              >
                {item.label && (
                  <div
                    className={"label " + item.labelClassName || ""}
                    style={item.labelStyle}
                  >
                    {item.label}
                  </div>
                )}
                {item.type === "text" && (
                  <input
                    className={"input is-static " + item.itemClassName || ""}
                    autoComplete="false"
                    placeholder={item.key || `please input ${item.label || ""}`}
                    value={item.value}
                    onChange={(e) => {
                      item.value = e.target.value;
                      setSchema((prev) => {
                        return [...prev];
                      });
                    }}
                  />
                )}
                {item.type === "textarea" && (
                  <textarea
                    className={"textarea " + item.itemClassName || ""}
                    placeholder={item.key || `please input ${item.label || ""}`}
                    value={item.value}
                    onChange={(e) => {
                      item.value = e.target.value;
                      setSchema((prev) => {
                        return [...prev];
                      });
                    }}
                  />
                )}
                {item.type === "list" && (
                  <>
                    {item.isNumberIndex && (
                      <ol className={item.listClassName || ""}>
                        {item.value.map((d) => {
                          return (
                            <li className={item.itemClassName || ""}>{d}</li>
                          );
                        })}
                      </ol>
                    )}
                    {!item.isNumberIndex && (
                      <ul className={item.listClassName || ""}>
                        {item.value.map((d) => {
                          return (
                            <li className={item.itemClassName || ""}>{d}</li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
                {item.type === "custom" && (
                  <div
                    className={"container " + item.itemClassName || ""}
                    dangerouslySetInnerHTML={{
                      __html: item.value,
                    }}
                  ></div>
                )}
                {item.type === "pic" && (
                  <img
                    className={"pic " + item.itemClassName || ""}
                    src={item.value}
                    alt=""
                  />
                )}
              </StyledContainer>
            </StyledContainerWrapper>
          );
        })}
      </div>

      <div className="sidebar">
        <div className="card">
          <div className="card-header">
            <p className="card-header-title">Config</p>
          </div>
          <div className="card-content">
            <div
              className="content"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div className="label">Globals:</div>
              <div
                className="p-2 mb-4"
                style={{
                  border: "1px solid rgba(0,0,0,0.2)",
                  borderRadius: "4px",
                }}
              >
                <div
                  className="mb-2"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <label className="label mb-0 mr-2">Global style:</label>
                  <button
                    className="button mr-2"
                    onClick={() => {
                      setCodeEditorVisible(true);
                      setCodeEditorConfig({
                        initialValue: globalSettings.style,
                        language: "scss",
                        onSubmit: (val) => {
                          setGlobalSettings((prev) => {
                            prev.style = val;
                            return { ...prev };
                          });
                        },
                      });
                    }}
                  >
                    Edit
                  </button>

                  <label className="label mb-0 mr-2">Bg pic:</label>
                  <div className="file">
                    <label className="file-label">
                      <input
                        className="file-input"
                        type="file"
                        name="resume"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length) {
                            const fr = new FileReader();
                            fr.onload = function () {
                              setGlobalSettings((prev) => {
                                prev.pic = fr.result;
                                return { ...prev };
                              });
                            };
                            fr.readAsDataURL(files[0]);
                          }
                        }}
                      />
                      <span className="file-cta">
                        <span className="file-icon">
                          <i className="fas fa-upload" />
                        </span>
                        <span className="file-label">
                          {globalSettings.pic ? "Change pic" : "Choose a file…"}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <label className="label mb-0 mr-2">Width:</label>
                  <input
                    className="input mr-2"
                    type="number"
                    value={globalSettings.width}
                    onChange={(e) => {
                      globalSettings.width = e.target.value;
                      setSchema((prev) => {
                        return [...prev];
                      });
                    }}
                  />

                  <label className="label mb-0 mr-2">Height:</label>
                  <input
                    className="input mr-2"
                    type="number"
                    value={globalSettings.height}
                    onChange={(e) => {
                      globalSettings.height = e.target.value;
                      setSchema((prev) => {
                        return [...prev];
                      });
                    }}
                  />
                </div>
              </div>

              <div className="label">Fields:</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div className="config-list">
                  {schema.map((item, i) => {
                    return (
                      <div
                        className="card p-2 mb-4"
                        style={{ border: "1px solid rgba(0,0,0,0.2)" }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="label">Key: {item.key}</div>
                          <button
                            className="button is-text ml-auto"
                            onClick={() => {
                              setSchema((prev) => {
                                return prev.filter((_, j) => i !== j);
                              });
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <div
                          className="card-content"
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <label className="label mb-0 mr-2">Key:</label>
                            <input
                              className="input mr-2"
                              value={item.key}
                              onChange={(e) => {
                                item.key = e.target.value;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            />

                            <label className="label mb-0 mr-2">Type:</label>
                            <div className="select">
                              <select
                                value={item.type}
                                onChange={(e) => {
                                  item.type = e.target.value;
                                  item.value =
                                    FieldDefaultConfig[item.type].value;
                                  item.style =
                                    FieldDefaultConfig[item.type].style;
                                  setSchema((prev) => {
                                    return [...prev];
                                  });
                                }}
                              >
                                <option value="text">Text</option>
                                <option value="textarea">Textarea</option>
                                <option value="list">List</option>
                                <option value="pic">Pic</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                          </div>

                          <label className="label mr-2">Label:</label>
                          <input
                            className="input mr-2"
                            value={item.label}
                            onChange={(e) => {
                              item.label = e.target.value;
                              setSchema((prev) => {
                                return [...prev];
                              });
                            }}
                          />

                          <label className="label mr-2">
                            Container class name:
                          </label>
                          <input
                            className="input mr-2"
                            value={item.containerClassName}
                            onChange={(e) => {
                              item.containerClassName = e.target.value;
                              setSchema((prev) => {
                                return [...prev];
                              });
                            }}
                          />

                          <label className="label mr-2">
                            label class name:
                          </label>
                          <input
                            className="input mr-2"
                            value={item.labelClassName}
                            onChange={(e) => {
                              item.labelClassName = e.target.value;
                              setSchema((prev) => {
                                return [...prev];
                              });
                            }}
                          />

                          <label className="label mr-2">Item class name:</label>
                          <input
                            className="input mr-2"
                            value={item.itemClassName}
                            onChange={(e) => {
                              item.itemClassName = e.target.value;
                              setSchema((prev) => {
                                return [...prev];
                              });
                            }}
                          />

                          <label className="label">Style:</label>
                          <button
                            className="button"
                            onClick={() => {
                              setCodeEditorVisible(true);
                              setCodeEditorConfig({
                                initialValue: item.style,
                                language: "scss",
                                onSubmit: (val) => {
                                  item.style = val;
                                  setSchema((prev) => {
                                    return [...prev];
                                  });
                                },
                              });
                            }}
                          >
                            Edit
                          </button>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <label className="label mb-0 mr-2">Dragable:</label>
                            <input
                              type="checkbox"
                              checked={item.dragable}
                              onChange={(e) => {
                                item.dragable = e.target.checked;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            />
                          </div>

                          {item.type === "list" && (
                            <>
                              <label className="label mr-2">
                                List class name:
                              </label>
                              <input
                                className="input mr-2"
                                value={item.listClassName}
                                onChange={(e) => {
                                  item.listClassName = e.target.value;
                                  setSchema((prev) => {
                                    return [...prev];
                                  });
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <label className="label mb-0 mr-2">
                                  Is number index:
                                </label>
                                <input
                                  type="checkbox"
                                  checked={item.isNumberIndex}
                                  onChange={(e) => {
                                    item.isNumberIndex = e.target.checked;
                                    setSchema((prev) => {
                                      return [...prev];
                                    });
                                  }}
                                />
                              </div>
                              <label className="label">Children:</label>
                              <div
                                className="p-4"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  border: "1px solid rgba(0,0,0,0.2)",
                                  borderRadius: "4px",
                                  height: "200px",
                                  overflow: "auto",
                                }}
                              >
                                {item.value.map((d, x) => {
                                  return (
                                    <input
                                      className="input mb-2"
                                      value={d}
                                      onChange={(e) => {
                                        item.value[x] = e.target.value;
                                        setSchema((prev) => {
                                          return [...prev];
                                        });
                                      }}
                                    />
                                  );
                                })}
                              </div>
                              <button
                                className="button mt-2"
                                onClick={() => {
                                  item.value.push("");
                                  setSchema((prev) => {
                                    return [...prev];
                                  });
                                }}
                              >
                                Add child
                              </button>
                            </>
                          )}
                          {item.type === "custom" && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <label className="label mb-0 mr-2">
                                Custom html:
                              </label>
                              <button
                                className="button mt-2"
                                onClick={() => {
                                  setCodeEditorVisible(true);
                                  setCodeEditorConfig({
                                    initialValue: item.value,
                                    language: "html",
                                    onSubmit: (val) => {
                                      item.value = val;
                                      setSchema((prev) => {
                                        return [...prev];
                                      });
                                    },
                                  });
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          )}

                          {item.type === "pic" && (
                            <>
                              <label className="label mb-0 mr-2">Pic:</label>
                              <div className="file">
                                <label className="file-label">
                                  <input
                                    className="file-input"
                                    type="file"
                                    name="resume"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length) {
                                        const fr = new FileReader();
                                        fr.onload = function () {
                                          item.value = fr.result;
                                          setSchema((prev) => {
                                            return [...prev];
                                          });
                                        };
                                        fr.readAsDataURL(files[0]);
                                      }
                                    }}
                                  />
                                  <span className="file-cta">
                                    <span className="file-icon">
                                      <i className="fas fa-upload" />
                                    </span>
                                    <span className="file-label">
                                      {item.value
                                        ? "Change pic"
                                        : "Choose a file…"}
                                    </span>
                                  </span>
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="field is-grouped mt-4"
                  style={{ justifyContent: "center" }}
                >
                  <button
                    className="button mr-4 mt-4"
                    onClick={() => {
                      localStorage.setItem(
                        "schema",
                        JSON.stringify(schema, null, 2)
                      );
                      localStorage.setItem(
                        "global_settings",
                        JSON.stringify(globalSettings, null, 2)
                      );
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="button mr-4 mt-4"
                    onClick={() => {
                      setSchema((prev) => {
                        return prev.concat({ ...FieldDefaultConfig.text });
                      });
                    }}
                  >
                    Add field
                  </button>
                  <button className="button mr-4 mt-4" onClick={() => {}}>
                    Export
                  </button>
                  <button
                    className="button mr-4 mt-4 is-danger"
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {codeEditorVisible && (
        <div className="modal is-active">
          <div className="modal-background"></div>
          <div className="modal-content">
            <div className="card p-2">
              <div className="label">Code editor</div>
              <div className="card-content">
                <div
                  id="code-editor"
                  style={{ height: "300px", overflow: "hidden" }}
                ></div>
                <div
                  className="field is-grouped mt-4"
                  style={{ justifyContent: "center" }}
                >
                  <p className="control">
                    <button
                      className="button is-danger"
                      onClick={() => {
                        setCodeEditorVisible(false);
                      }}
                    >
                      Cancel
                    </button>
                  </p>
                  <p className="control">
                    <button
                      className="button is-link"
                      onClick={() => {
                        codeEditorConfig.onSubmit(codeEditorContent);
                        setCodeEditorVisible(false);
                      }}
                    >
                      Confirm
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StyledApp>
  );
}

export default App;
