import * as d3 from "d3";
import { useEffect, useLayoutEffect, useState } from "react";
import styled, { css } from "styled-components";
import * as monaco from "monaco-editor";
import domtoimage from "dom-to-image";

function saveJsonFile(content, fileName) {
  const a = document.createElement("a");
  const file = new Blob([JSON.stringify(content, null, 2)], {
    type: "text/plain",
  });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

const StyledApp = styled.div`
  position: relative;
  .sidebar {
    position: absolute;
    left: 24px;
    top: 24px;
    width: 500px;
  }

  .total-pic {
    left: 600px;
    top: 24px;
    position: absolute;
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
  /* list: {
   *   type: "list",
   *   style: ".field-container {\r\n    ul {}\r\n    ol {}\r\n    li {}\r\n}",
   *   pos: { x: 100, y: 100 },
   *   key: "",
   *   isNumberIndex: false,
   *   containerClassName: "",
   *   labelClassName: "",
   *   listClassName: "",
   *   itemClassName: "",
   *   value: [],
   *   dragable: true,
   * }, */
  pic: {
    type: "pic",
    style:
      ".field-container {\r\n    .pic { width: 128px; height: 128px; background: #ffffff; }\r\n}",
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
          style: ".total-pic {}",
          className: "",
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
  } else {
    bannerStyle.backgroundColor = `#f4f4f4`;
  }
  return (
    <StyledApp id="app" extraStyle={globalSettings.style}>
      <div
        className={"total-pic " + globalSettings.className}
        style={bannerStyle}
      >
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
                    className={"input " + item.itemClassName || ""}
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
                {/* {item.type === "list" && (
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
                    )} */}
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
        <div className="rounded-2xl bg-stone-50 p-4">
          <div className="text-xl font-bold mb-4">Config</div>
          <div className="card-content">
            <div className="flex flex-col">
              <div className="font-bold">Globals:</div>
              <div className="p-4 mb-4 rounded border border-stone-400 bg-stone-300">
                <div className="mb-2 flex items-center">
                  <label className="text-sm shrink-0 font-bold mr-2">
                    Global style:
                  </label>
                  <button
                    className="rounded border border-stone-500 bg-stone-200 p-1 text-sm text-sm hover:bg-stone-600 hover:text-white mr-2 transition-all"
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

                  <div className="text-sm shrink-0 font-bold mr-2">Bg pic:</div>
                  <input
                    className="p-2 text-sm text-stone-50 bg-stone-500 border-stone-500 rounded border cursor-pointer file:border-none file:rounded file:text-sm file:font-bold file:mr-2 file:bg-stone-50 mr-2"
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
                  <button
                    className="ml-auto text-sm underline text-rose-500 hover:text-rose-300 transition-all"
                    onClick={() => {
                      setGlobalSettings((prev) => {
                        prev.pic = null;
                        return { ...prev };
                      });
                    }}
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center mb-2">
                  <div className="text-sm font-bold mr-2">
                    Global class name:
                  </div>
                  <input
                    className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none mr-2 grow"
                    value={globalSettings.className}
                    onChange={(e) => {
                      setGlobalSettings((prev) => {
                        prev.className = e.target.value;
                        return { ...prev };
                      });
                    }}
                  />
                </div>

                <div className="flex items-center w-full mb-2">
                  <div className="text-sm font-bold mr-2">Width:</div>
                  <input
                    className="input text-sm border border-stone-400 p-1 rounded mr-2 grow-1 outline-none grow"
                    type="number"
                    value={globalSettings.width}
                    onChange={(e) => {
                      setGlobalSettings((prev) => {
                        globalSettings.width = e.target.value;
                        return { ...prev };
                      });
                    }}
                  />
                </div>

                <div className="flex items-center w-full">
                  <div className="text-sm font-bold mr-2">Height:</div>
                  <input
                    className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none grow"
                    type="number"
                    value={globalSettings.height}
                    onChange={(e) => {
                      setGlobalSettings((prev) => {
                        globalSettings.height = e.target.value;
                        return { ...prev };
                      });
                    }}
                  />
                </div>
              </div>

              <div className="font-bold">Fields:</div>
              <div className="flex flex-col">
                <div className="config-list">
                  {schema.map((item, i) => {
                    return (
                      <div className="p-4 mb-4 rounded border border-stone-400 bg-stone-300">
                        <div className="flex items-center mb-4">
                          <div className="font-bold mr-2">{item.key}</div>
                          <div className="ml-auto">
                            <button
                              className="text-sm underline text-stone-500 hover:text-stone-400 transition-all mr-2"
                              onClick={() => {
                                if (i <= 0) {
                                  return;
                                }
                                const tmp = schema[i - 1];
                                schema[i - 1] = schema[i];
                                schema[i] = tmp;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            >
                              Move up
                            </button>
                            <button
                              className="text-sm underline text-stone-500 hover:text-stone-400 transition-all mr-2"
                              onClick={() => {
                                if (
                                  schema.length > 1 &&
                                  i !== schema.length - 1
                                ) {
                                  const tmp = schema[i + 1];
                                  schema[i + 1] = schema[i];
                                  schema[i] = tmp;
                                  setSchema((prev) => {
                                    return [...prev];
                                  });
                                }
                              }}
                            >
                              Move down
                            </button>
                            <button
                              className="text-sm underline text-rose-500 hover:text-rose-400 transition-all"
                              onClick={() => {
                                setSchema((prev) => {
                                  return prev.filter((_, j) => i !== j);
                                });
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center mb-2">
                            <div className="text-sm font-bold mr-2">Key:</div>
                            <input
                              className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none mr-2"
                              value={item.key}
                              onChange={(e) => {
                                item.key = e.target.value;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            />

                            <div className="text-sm font-bold mr-2">Type:</div>
                            <div>
                              <select
                                className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none mr-2 cursor-pointer transition-all"
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
                                {/* <option value="list">List</option> */}
                                <option value="pic">Pic</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center mb-2">
                            <div className="text-sm font-bold mr-2">Label:</div>
                            <input
                              className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none mr-2 grow"
                              value={item.label}
                              onChange={(e) => {
                                item.label = e.target.value;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            />
                          </div>

                          <div className="flex items-center mb-2">
                            <div className="text-sm font-bold mr-2">
                              Container class name:
                            </div>
                            <input
                              className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none mr-2 grow"
                              value={item.containerClassName}
                              onChange={(e) => {
                                item.containerClassName = e.target.value;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            />
                          </div>

                          <div className="flex items-center mb-2">
                            <div className="text-sm font-bold mr-2">
                              Label class name:
                            </div>
                            <input
                              className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none mr-2 grow"
                              value={item.labelClassName}
                              onChange={(e) => {
                                item.labelClassName = e.target.value;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            />
                          </div>

                          <div className="flex items-center mb-2">
                            <div className="text-sm font-bold mr-2">
                              Item class name:
                            </div>
                            <input
                              className="input text-sm border border-stone-400 p-1 rounded shrink-0 grow-1 outline-none mr-2 grow"
                              value={item.itemClassName}
                              onChange={(e) => {
                                item.itemClassName = e.target.value;
                                setSchema((prev) => {
                                  return [...prev];
                                });
                              }}
                            />
                          </div>

                          <div className="flex items-center mb-2">
                            <div className="text-sm font-bold mr-2">Style:</div>
                            <button
                              className="rounded border border-stone-500 bg-stone-200 p-1 text-sm text-sm hover:bg-stone-600 hover:text-white mr-4 transition-all"
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

                            <div className="text-sm font-bold mr-2">
                              Dragable:
                            </div>
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

                          {/* {item.type === "list" && (
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
                              )} */}
                          {item.type === "custom" && (
                            <div className="flex items-center">
                              <div className="text-sm font-bold mr-2">
                                Custom html:
                              </div>
                              <button
                                className="rounded border border-stone-500 bg-stone-200 p-1 text-sm text-sm hover:bg-stone-600 hover:text-white mr-2 transition-all"
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
                            <div className="flex items-center">
                              <div className="text-sm font-bold mr-2">Pic:</div>
                              <div className="file">
                                <input
                                  type="file"
                                  className="p-2 text-sm text-stone-50 bg-stone-500 border-stone-500 rounded border cursor-pointer file:border-none file:rounded file:text-sm file:font-bold file:mr-2 file:bg-stone-50 mr-2 grow"
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
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    className="bg-stone-300 p-2 rounded-md hover:bg-stone-500 hover:text-white mr-4 transition-all"
                    onClick={() => {
                      localStorage.setItem(
                        "schema",
                        JSON.stringify(schema, null, 2)
                      );
                      localStorage.setItem(
                        "global_settings",
                        JSON.stringify(globalSettings, null, 2)
                      );
                      saveJsonFile(
                        {
                          schema: schema,
                          global_settings: globalSettings,
                        },
                        "data.json"
                      );
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="bg-stone-300 p-2 rounded-md hover:bg-stone-500 hover:text-white mr-4 transition-all"
                    onClick={() => {
                      const inputDom = document.createElement("input");
                      inputDom.type = "file";
                      inputDom.accept = "application/JSON";
                      inputDom.addEventListener("change", (e) => {
                        const files = e.target.files;
                        if (files && files.length) {
                          const fr = new FileReader();
                          fr.onload = () => {
                            const data = JSON.parse(fr.result);
                            setSchema(data.schema);
                            setGlobalSettings(data.global_settings);
                            document.body.removeChild(inputDom);
                          };
                          fr.readAsText(files[0]);
                        }
                      });
                      document.body.appendChild(inputDom);
                      inputDom.click();
                    }}
                  >
                    Import
                  </button>

                  <button
                    className="bg-stone-300 p-2 rounded-md hover:bg-stone-500 hover:text-white mr-4 transition-all"
                    onClick={() => {
                      setSchema((prev) => {
                        return prev.concat({ ...FieldDefaultConfig.text });
                      });
                    }}
                  >
                    Add field
                  </button>
                  <button
                    className="bg-stone-300 p-2 rounded-md hover:bg-stone-500 hover:text-white mr-4 transition-all"
                    onClick={() => {
                      document.querySelector(".total-pic").style.left = 0;
                      document.querySelector(".total-pic").style.top = 0;
                      domtoimage
                        .toPng(document.querySelector(".total-pic"))
                        .then(function (dataUrl) {
                          const a = document.createElement("a");
                          a.href = dataUrl;
                          a.download = "output.png";
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        })
                        .catch(function (error) {
                          console.error("oops, something went wrong!", error);
                        })
                        .finally(() => {
                          document.querySelector(".total-pic").style.left =
                            "600px";
                          document.querySelector(".total-pic").style.top =
                            "24px";
                        });
                    }}
                  >
                    Export
                  </button>
                  <button
                    className="bg-rose-500 p-2 text-white rounded-md hover:bg-rose-400 hover:text-black mr-4 transition-all"
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
        <div
          className="relative z-10"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-3/5 h-4/6"
                style={{ height: "600px" }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex flex-col">
                    <div className="text-xl font-bold mb-4">Code editor</div>
                    <div
                      id="code-editor"
                      style={{
                        width: "100%",
                        height: "450px",
                        overflow: "hidden",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      codeEditorConfig.onSubmit(codeEditorContent);
                      setCodeEditorVisible(false);
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setCodeEditorVisible(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
