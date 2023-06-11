import IRunOnTabReady from "../types/i-run-on-tab-ready";

/**
 * The following tasks are perfomrd in series !!!!! 
    1.  The background create a tab
    2.  The background send a message to the content script which 
        perform a long processing task and send the datetime at the 
        task start\end back to the background using async sendResponse </li>
    3. The background delete the created tab</li>
 * @param {*} url 
 * @param {*} runOnTabReady 
 */
const runOnTabReadyDefault = async (params: IRunOnTabReady) => {
  const { tabId, messageObj, onComplete } = params;
  console.log("start runOnTabReady");
  // --- you can also use chrome.tabs.sendMessage with callback instead of promise
  const response = await chrome.tabs.sendMessage(tabId, messageObj);
  console.log("got response in background");
  console.log(response);

  await chrome.tabs.remove(tabId);
  console.log(`------------- tab id ${tabId} is removed`);

  onComplete(response); // --- put in the end
};

export async function sendMessageBetweenTabCreateRemove(
  url: string,
  messageObj: object
): Promise<unknown> {
  return createTabAndWaitForReadySendMessageWaitForResponseAndRemoveTab(
    url,
    runOnTabReadyDefault,
    messageObj
  );
}

async function createTabAndWaitForReadySendMessageWaitForResponseAndRemoveTab(
  url: string,
  runOnTabReady: (params: IRunOnTabReady) => void,
  messageObj: object
): Promise<unknown> {
  const tab = await chrome.tabs.create({
    url,
  });
  const tabId = tab.id;
  console.log(`---------- new tab is created : ${tabId}`);

  const p = new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(
      updatedTabId: number,
      changeInfo: any
    ) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        // --- await here is not working so i have to use promise
        runOnTabReady({ tabId, onComplete: resolve, messageObj });
        // Remove the event listener
        chrome.tabs.onUpdated.removeListener(listener);
      }
    });
  });

  return p;
}