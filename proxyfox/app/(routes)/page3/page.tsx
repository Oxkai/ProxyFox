"use client";
import data from "../../../lib/db.json";
import { useState } from "react";
import Link from 'next/link'
type Tool = {
  toolName: string;
  description: string;
  price: string;
};

type Server = {
  serverName: string;
  description: string;
  monetizedUri: string;
  serverId: string;
  tools: Tool[];
};


export default function Page3() {
  const servers: Server[] = data;
  const [showModal, setShowModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  return (
    <div className="w-full px-[100px] flex flex-col justify-center items-center bg-black border-t border-b border-[#1f1f1f]">
      {/* Header */}
      <div className="pt-[23px] px-[46px] pb-[23px] mb-[-0.5px] mt-[-1px] flex flex-col justify-center items-start w-full border border-[#1f1f1f]">
        <div className="flex flex-col items-start gap-[17px] w-full">
          <h1 className="w-full text-[#ededed] font-['Helvetica_Neue'] text-4xl font-bold">
            Monetized Servers
          </h1>
          <p className="w-full text-[#a1a1a1] text-base font-normal">
            To deploy a new Project, import an existing Git Repository or get started with one of our Templates.
          </p>
        </div>
      </div>

      {/* Server Cards */}
      <div className="flex flex-wrap justify-start w-full   items-start">
        {servers.map((server, index) => (
          <div
            key={index}
            className="max-w-[calc(100%/3)] pt-12 pl-10 pb-12 pr-10 ml-[-0.5px] flex flex-col items-start gap-11 border border-zinc-800 bg-black"
          >
            <div className="px-2 flex flex-col items-start gap-5 w-full">
              <h1 className="text-white font-bold text-[29px] leading-none">
                {server.serverName}
              </h1>
              <p className="w-full h-[57px] text-zinc-400 text-base">
                {server.description}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2.5 w-full">
              <div
                onClick={() => {
                  navigator.clipboard.writeText(server.monetizedUri);
                  alert("URL copied to clipboard!");
                }}
                className="flex flex-row py-2 px-3 items-center gap-2.5 w-full rounded-md border border-zinc-800"
              >
                <span className="flex-1 text-zinc-400 text-sm">{server.monetizedUri}</span>
              </div>

             
              <Link
  href={`/servers/${server.serverId}`}
  className="flex flex-row h-10 py-2 px-3 justify-center items-center w-full text-black rounded-md border border-zinc-200 bg-zinc-200"
>
  Visit
</Link>

              <button
                onClick={() => {
                  setSelectedServer(server);
                  setShowModal(true);
                }}
                className="flex flex-row h-10 py-2 px-3 justify-center items-center w-full rounded-md border border-[#242424] bg-[#0A0A0A]
                hover:bg-[#181818] hover:text-[#1f1f1f] 
             transition-all duration-100 ease-in-out
                "
              >
                <span className="text-[#EDEDED] text-[16px]">View Tools</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="flex flex-row mt-[-0.5px] mb-[-1px] px-[0.5px] h-[91px] items-center w-full">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="h-[91px] flex-1 mx-[-0.5px] border border-[#1f1f1f]" />
        ))}
      </div>

      {/* Modal */}
      {showModal && selectedServer && (
        <div className="fixed inset-0 bg-black/80 flex flex-col px-[319px] border border-[#1f1f1f] items-center justify-center z-50">
          <div className="bg-[#0A0A0A] flex flex-col border border-[#1f1f1f] rounded-[13px] items-center justify-center">
            <div className="h-[54px] w-[642px] px-[17px] py-[15px] flex border-b border-[#1f1f1f] items-center justify-center">
              <h2 className="text-[#8F8F8F] w-full text-start text-[18px] font-normal">
                What do you need?
              </h2>
            </div>

            <div className="w-[642px] px-[17px] py-[15px] flex flex-col gap-[16px] border-[#2C2C2C] items-center justify-center">
              {selectedServer.tools.map((tool, index) => (
                <div
                  key={index}
                  className="flex flex-row py-3 px-3 justify-between items-center w-full rounded-md border border-[#1f1f1f]
                  hover:bg-[#181818] hover:text-[#1f1f1f] 
                  transition-all duration-100 ease-in-out
                  
                  "
                >
                  <div className="flex flex-col gap-[10px] items-start">
                    <span className="text-[#EDEDED] text-sm">{tool.toolName}</span>
                    <span className="text-[#a1a1a1] text-sm capitalize">{tool.description}</span>
                  </div>
                  <div className="flex flex-row h-[42px] py-[9px] px-3 items-center rounded-md border border-[#1f1f1f]">
                    <span className="text-[#EDEDED] text-base">$ {tool.price}</span>
                  </div>
                </div>
              ))}
            </div>

   <button
  onClick={() => setShowModal(false)}
  className="w-full border-t border-[#1f1f1f] py-3 text-center text-[#a1a1a1] 
             hover:bg-[#EDEDED] hover:text-[#1f1f1f] 
             transition-all duration-100 ease-in-out rounded-b-[13px]"
>
  Close
</button>

          </div>
        </div>
      )}
    </div>
  );
}
