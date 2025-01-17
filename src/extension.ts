/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { AzExtTreeDataProvider, AzureTreeItem, AzureUserInput, callWithTelemetryAndErrorHandling, createApiProvider, createAzExtOutputChannel, IActionContext, registerCommand, registerErrorHandler, registerReportIssueCommand, registerUIExtensionVariables } from 'vscode-azureextensionui';
// tslint:disable-next-line:no-submodule-imports
import { AzureExtensionApi, AzureExtensionApiProvider } from 'vscode-azureextensionui/api';
import { addSshKey } from './commands/addSshKey';
import { revealTreeItem } from './commands/api/revealTreeItem';
import { copyIpAddress } from './commands/copyIpAddress';
import { createVirtualMachine, createVirtualMachineAdvanced } from './commands/createVirtualMachine/createVirtualMachine';
import { deleteVirtualMachine } from './commands/deleteVirtualMachine/deleteVirtualMachine';
import { openInPortal } from './commands/openInPortal';
import { openInRemoteSsh } from './commands/openInRemoteSsh';
import { restartVirtualMachine } from './commands/restartVirtualMachine';
import { startVirtualMachine } from './commands/startVirtualMachine';
import { stopVirtualMachine } from './commands/stopVirtualMachine';
import { remoteSshExtensionId } from './commands/verifyRemoteSshExtension';
import { viewProperties } from './commands/viewProperties';
import { ext } from './extensionVariables';
import { AzureAccountTreeItem } from './tree/AzureAccountTreeItem';

export async function activateInternal(context: vscode.ExtensionContext, perfStats: { loadStartTime: number; loadEndTime: number }, ignoreBundle?: boolean): Promise<AzureExtensionApiProvider> {
    ext.context = context;
    ext.ignoreBundle = ignoreBundle;
    ext.outputChannel = createAzExtOutputChannel('Azure Virtual Machines', ext.prefix);
    context.subscriptions.push(ext.outputChannel);
    ext.ui = new AzureUserInput(context.globalState);

    registerUIExtensionVariables(ext);

    await callWithTelemetryAndErrorHandling('azureVirtualMachines.activate', async (activateContext: IActionContext) => {
        activateContext.telemetry.properties.isActivationEvent = 'true';
        activateContext.telemetry.measurements.mainFileLoad = (perfStats.loadEndTime - perfStats.loadStartTime) / 1000;

        ext.azureAccountTreeItem = new AzureAccountTreeItem();
        context.subscriptions.push(ext.azureAccountTreeItem);
        ext.tree = new AzExtTreeDataProvider(ext.azureAccountTreeItem, 'azureVirtualMachines.loadMore');
        ext.treeView = vscode.window.createTreeView('azVmTree', { treeDataProvider: ext.tree, showCollapseAll: true });
        context.subscriptions.push(ext.treeView);

        registerCommand('azureVirtualMachines.selectSubscriptions', () => vscode.commands.executeCommand('azure-account.selectSubscriptions'));
        registerCommand('azureVirtualMachines.refresh', async (actionContext: IActionContext, node?: AzureTreeItem) => await ext.tree.refresh(actionContext, node));
        registerCommand('azureVirtualMachines.loadMore', async (actionContext: IActionContext, node: AzureTreeItem) => await ext.tree.loadMore(node, actionContext));
        registerCommand('azureVirtualMachines.openInPortal', openInPortal);
        registerCommand('azureVirtualMachines.createVirtualMachine', createVirtualMachine);
        registerCommand('azureVirtualMachines.createVirtualMachineAdvanced', createVirtualMachineAdvanced);
        registerCommand('azureVirtualMachines.startVirtualMachine', startVirtualMachine);
        registerCommand('azureVirtualMachines.restartVirtualMachine', restartVirtualMachine);
        registerCommand('azureVirtualMachines.stopVirtualMachine', stopVirtualMachine);
        registerCommand('azureVirtualMachines.addSshKey', addSshKey);
        registerCommand('azureVirtualMachines.deleteVirtualMachine', deleteVirtualMachine);
        registerCommand('azureVirtualMachines.copyIpAddress', copyIpAddress);
        registerCommand('azureVirtualMachines.viewProperties', viewProperties);
        registerCommand('azureVirtualMachines.openInRemoteSsh', openInRemoteSsh);
        registerCommand('azureVirtualMachines.showOutputChannel', () => { ext.outputChannel.show(); });
        registerCommand('azureVirtualMachines.showRemoteSshExtension', () => { vscode.commands.executeCommand('extension.open', remoteSshExtensionId); });

        // Suppress "Report an Issue" button for all errors in favor of the command
        registerErrorHandler(c => c.errorHandling.suppressReportIssue = true);
        registerReportIssueCommand('azureVirtualMachines.reportIssue');
    });

    return createApiProvider([<AzureExtensionApi>{
        revealTreeItem,
        apiVersion: '1.0.0'
    }]);
}

// tslint:disable-next-line:no-empty
export function deactivateInternal(): void {
}
