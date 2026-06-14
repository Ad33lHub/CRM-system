import{c as n,l as s}from"./index-DHIt4dQE.js";/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=n("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=n("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]),o=s.injectEndpoints({endpoints:i=>({createMeeting:i.mutation({query:e=>({url:"/meetings",method:"POST",body:e}),invalidatesTags:["Meeting"]}),getMeetings:i.query({query:(e={})=>({url:"/meetings",params:e}),providesTags:["Meeting"]}),getMeetingById:i.query({query:e=>({url:`/meetings/${e}`}),providesTags:(e,a,t)=>[{type:"Meeting",id:t}]}),uploadMeetingAudio:i.mutation({query:({id:e,file:a})=>{const t=new FormData;return t.append("audio",a),{url:`/meetings/${e}/upload`,method:"POST",body:t}},invalidatesTags:(e,a,{id:t})=>[{type:"Meeting",id:t},"Meeting"]}),deleteMeeting:i.mutation({query:e=>({url:`/meetings/${e}`,method:"DELETE"}),invalidatesTags:["Meeting"]})}),overrideExisting:!1}),{useCreateMeetingMutation:u,useGetMeetingByIdQuery:y,useUploadMeetingAudioMutation:p}=o;export{g as M,r as U,p as a,y as b,u};
